# AWS Migration Notes

## RDS

1. Apply [`aws/rds/migrations/001_init_docs_schema.sql`](./rds/migrations/001_init_docs_schema.sql) to your AWS RDS PostgreSQL database.
2. Ensure the `pgvector` extension is available in the target RDS instance.

## Lambda

- `aws/lambda/process-document.ts`
  - Intended for an S3 event trigger.
  - Handles `ObjectCreated:*` by fetching the uploaded `.mdx`, parsing metadata, rebuilding sections, and regenerating embeddings.
  - Handles `ObjectRemoved:*` by deleting the document row from RDS.

- `aws/lambda/search-documents.ts`
  - Intended for an API Gateway or Lambda Function URL endpoint.
  - Returns public search results from `search_documents(...)`.

- `aws/lambda/chat-documents.ts`
  - Intended for an API Gateway or Lambda Function URL endpoint.
  - Returns an AI answer plus source URLs using RDS vector matches.

- `aws/lambda/docs-tree/index.ts`
  - Intended for an API Gateway or Lambda Function URL endpoint.
  - Returns the docs tree/list from the database.

- `aws/lambda/docs-page/index.ts`
  - Intended for an API Gateway or Lambda Function URL endpoint.
  - Returns one document by slug, loading the selected file from S3 only when requested.

## process-document.ts Migration Guide

This is the target flow for [`aws/lambda/process-document.ts`](./lambda/process-document.ts):

1. A document is uploaded to S3.
2. S3 emits an event to EventBridge.
3. EventBridge invokes `process-document`.
4. Lambda reads the uploaded object from S3 with the AWS SDK.
5. Lambda parses frontmatter and markdown sections.
6. Lambda generates embeddings with Amazon Bedrock Titan Text Embeddings V2.
7. Lambda writes document rows, sections, and vectors into PostgreSQL.

### Current Gaps In The File

The current implementation works for direct S3 notification records and OpenAI embeddings, but it needs these changes for the Bedrock/EventBridge design:

- It expects `event.Records`, which is the S3 notification shape, not the EventBridge event shape.
- It fetches the document through a public URL with `fetch(...)` instead of reading the object with `GetObject`.
- It generates embeddings through OpenAI and inserts them as `vector(768)`.
- Titan Text Embeddings V2 uses `amazon.titan-embed-text-v2:0` and supports `1024`, `512`, or `256` dimensions. Pick one and make Postgres match it.

### Step 1: Install The AWS SDK Clients

Add the SDK packages used by this Lambda:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/client-bedrock-runtime
```

### Step 2: Enable S3 To Publish Into EventBridge

Turn on EventBridge delivery for the bucket that stores the MDX files.

Console path:

1. Open the S3 bucket.
2. Go to `Properties`.
3. Find `Event notifications`.
4. Enable `Send notifications to Amazon EventBridge for all events in this bucket`.

CLI example:

```bash
aws s3api put-bucket-notification-configuration \
  --bucket YOUR_BUCKET_NAME \
  --notification-configuration '{ "EventBridgeConfiguration": {} }'
```

### Step 3: Create The EventBridge Rule

Create a rule that filters only the bucket and event types you care about, then add the Lambda as the target.

Example event pattern:

```json
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created", "Object Deleted"],
  "detail": {
    "bucket": {
      "name": ["YOUR_BUCKET_NAME"]
    }
  }
}
```

The Lambda handler must read the EventBridge payload from `event.detail`, not `event.Records`.

Relevant fields:

```json
{
  "detail-type": "Object Created",
  "detail": {
    "bucket": {
      "name": "YOUR_BUCKET_NAME"
    },
    "object": {
      "key": "docs/example.mdx",
      "version-id": "optional-version-id",
      "sequencer": "617f08299329d189"
    }
  }
}
```

Use `detail-type` to branch create vs delete logic.
Use `detail.object.key` as the S3 key.
If bucket versioning is enabled, pass `detail.object.version-id` into `GetObject` so the Lambda reads the exact object version that raised the event.

### Step 4: Allow EventBridge To Invoke The Lambda ###NOT IMPLEMENT

Add a resource policy statement to the Lambda so the EventBridge rule can invoke it.

Example:

```bash
aws lambda add-permission \
  --function-name process-document \
  --statement-id allow-eventbridge-process-document \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:REGION:ACCOUNT_ID:rule/RULE_NAME
```

### Step 5: Lambda Execution Role Permissions

Attach at least these permissions to the Lambda execution role:

- CloudWatch Logs permissions such as `logs:CreateLogGroup`, `logs:CreateLogStream`, and `logs:PutLogEvents`.
- `s3:GetObject` on the document bucket or the specific prefix used for uploaded docs.
- `s3:GetObjectVersion` if the bucket is versioned and the Lambda reads `version-id` from the event.
- `bedrock:InvokeModel` for `amazon.titan-embed-text-v2:0`.
- `secretsmanager:GetSecretValue` if `DATABASE_URL` or DB credentials are stored in Secrets Manager.
- `kms:Decrypt` if that secret is encrypted with a customer-managed KMS key.

If the Postgres database is inside a VPC, the Lambda also needs VPC networking permissions. The simplest path is attaching `AWSLambdaVPCAccessExecutionRole`, or granting the equivalent ENI permissions directly.

### Step 6: Networking For PostgreSQL

If PostgreSQL is in RDS or any private VPC network:

1. Put the Lambda in the same VPC.
2. Select private subnets that can reach the database.
3. Allow outbound traffic from the Lambda security group.
4. Allow inbound traffic on the Postgres port from the Lambda security group to the DB security group.

If the Lambda is attached to a VPC and still needs outbound access to public AWS service endpoints, make sure the subnets have working outbound connectivity such as NAT or the appropriate VPC endpoints.

### Step 7: Patch process-document.ts

Make these changes in [`aws/lambda/process-document.ts`](./lambda/process-document.ts):

1. Replace the OpenAI imports and client with Bedrock runtime imports:

```ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
```

2. Replace the public URL fetch in `fetchDocumentText(...)` with S3 `GetObject`.

Example shape:

```ts
const s3 = new S3Client({});

async function fetchDocumentText(
  bucketName: string,
  storageKey: string,
  versionId?: string,
) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      ...(versionId ? { VersionId: versionId } : {}),
    }),
  );

  return await response.Body!.transformToString();
}
```

3. Replace the OpenAI embedding call with a Titan V2 `InvokeModel` call.

Example helper:

```ts
const bedrock = new BedrockRuntimeClient({});

async function getEmbedding(content: string) {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: process.env.BEDROCK_EMBEDDING_MODEL_ID ?? "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: content,
        dimensions: Number(process.env.BEDROCK_EMBEDDING_DIMENSIONS ?? "512"),
        normalize: true,
      }),
    }),
  );

  const payload = JSON.parse(new TextDecoder().decode(response.body));
  return payload.embedding as number[];
}
```

4. Update the insert SQL so the vector size matches Titan.

Example if you choose `512` dimensions:

```sql
insert into document_embeddings (document_id, content, embedding)
values ($1, $2, $3::vector(512))
```

Do not keep `vector(768)` if you move to Titan V2.

5. Change the handler to use the EventBridge event shape.

At minimum, the handler needs:

- `event["detail-type"]`
- `event.detail.bucket.name`
- `event.detail.object.key`
- `event.detail.object["version-id"]` when versioning matters
- `event.detail.object.sequencer` if you later want protection against out-of-order delivery

6. Keep the existing transaction, metadata parsing, section rebuilding, and delete/reinsert behavior.

Those parts are already aligned with the new flow.

### Step 8: Postgres Vector Dimension

Pick one Titan dimension and use it consistently:

- `1024` for the default full-size vector
- `512` for a smaller index and lower storage cost
- `256` for the smallest footprint

The pgvector column definition, insert cast, and any vector index must use the same dimension.
If your schema currently uses `vector(768)`, you must migrate that column before writing Titan embeddings.

## Environment Variables

These values are expected by the Next.js app and/or Lambda functions:

- `AWS_REGION`
- `BEDROCK_EMBEDDING_MODEL_ID`
  - Optional for `process-document.ts`. Suggested value: `amazon.titan-embed-text-v2:0`.
- `BEDROCK_EMBEDDING_DIMENSIONS`
  - Optional for `process-document.ts`. Use `1024`, `512`, or `256`. This must match the pgvector column dimension.
- `NEXT_PUBLIC_DOCS_TREE_API_URL`
  - Public API Gateway URL for the docs tree Lambda.
- `NEXT_PUBLIC_DOCS_PAGE_API_URL`
  - Public API Gateway URL for the docs page Lambda. The app appends `?slug=...` when loading a specific document.
- `NEXT_PUBLIC_DOCS_SEARCH_API_URL`
  - Public API Gateway URL for the search Lambda. The browser calls this directly.
- `NEXT_PUBLIC_DOCS_CHAT_API_URL`
  - Public API Gateway URL for the chat Lambda. The browser calls this directly.
- `CORS_ALLOW_ORIGIN`
  - Optional for the search and chat Lambdas. Defaults to `*`. Set this to your site origin if you want stricter browser access control.
- `OPENAI_EMBEDDING_MODEL` (optional, defaults to `text-embedding-3-small`)
  - Still used by `process/index.ts` for document embeddings.

## App Endpoints

The Next.js app now calls API Gateway endpoints directly from the browser:

- `NEXT_PUBLIC_DOCS_TREE_API_URL`
- `NEXT_PUBLIC_DOCS_PAGE_API_URL`
- `NEXT_PUBLIC_DOCS_SEARCH_API_URL`
- `NEXT_PUBLIC_DOCS_CHAT_API_URL`

The docs-tree, docs-page, search, and chat Lambdas must return CORS headers and
respond to `OPTIONS` for browser clients. `aws/lambda/shared/http.ts`
centralizes that response shape.

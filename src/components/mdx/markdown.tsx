import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import {
  Children,
  type ComponentProps,
  ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  Suspense,
  use,
  useDeferredValue,
} from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";

export interface Processor {
  process: (content: string) => Promise<ReactNode>;
}

function createProcessor(): Processor {
  const processor = remark().use(remarkGfm).use(remarkRehype);

  return {
    async process(content) {
      const nodes = processor.parse({ value: content });
      const hast = await processor.run(nodes);

      return toJsxRuntime(hast, {
        development: false,
        jsx,
        jsxs,
        Fragment,
        components: {
          ...defaultMdxComponents,
          pre: Pre,
          img: Image, // use JSX
        },
      });
    },
  };
}

function Image(props: ComponentPropsWithoutRef<"img">) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={props.alt ?? "image"}
      className={`rounded-lg w-full h-auto my-4 ${props.className ?? ""}`}
    />
  );
}

function Pre(props: ComponentProps<"pre">) {
  const code = Children.only(props.children) as ReactElement;
  const codeProps = code.props as ComponentProps<"code">;

  let lang =
    codeProps.className
      ?.split(" ")
      .find((v) => v.startsWith("language-"))
      ?.slice("language-".length) ?? "text";

  if (lang === "mdx") lang = "md";

  return (
    <DynamicCodeBlock
      lang={lang}
      code={(codeProps.children ?? "") as string}
     
    />
  );
}

const processor = createProcessor();

export function Markdown({ text }: { text: string }) {
  const deferredText = useDeferredValue(text);

  return (
    <Suspense fallback={text}>
      <Renderer text={deferredText} />
    </Suspense>
  );
}

const MAX_MARKDOWN_CACHE_ENTRIES = 100;
const cache = new Map<string, Promise<ReactNode>>();

function getCachedMarkdown(text: string) {
  const existing = cache.get(text);

  if (existing) {
    return existing;
  }

  const result = processor.process(text);
  cache.set(text, result);

  if (cache.size > MAX_MARKDOWN_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  void result.catch(() => {
    if (cache.get(text) === result) {
      cache.delete(text);
    }
  });

  return result;
}

function Renderer({ text }: { text: string }) {
  return use(getCachedMarkdown(text));
}

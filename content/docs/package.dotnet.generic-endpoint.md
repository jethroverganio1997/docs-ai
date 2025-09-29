---
title: "Generic Endpoint"
description: "A reusable component library originally for our company but can be used for any .NET project that uses an endpoint. It provides a set of generic classes and interfaces to simplify the implementation of endpoints in .NET applications."
---

# Installation

```bash
dotnet add package FEE.Remit.Generic.Endpoint
```

## Features

- Reusable endpoint implementation
- Generic error handler
- Extensions to further minimize boilerplate code
- Helper classes for common tasks like converting xml to json and vice versa
- Repository pattern for endpoints
- Also implements SOLID principle
- Multi Format Request Support
- Execution Time Logger for each endpoints
- Generic Get and CRUD repository implementation

## Dark Theme

- Add these lines to your Progam.cs > UseDocs()
  ```csharp
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new ManifestEmbeddedFileProvider(typeof(EndpointHelper).Assembly, "wwwroot"),
            RequestPath = ""
        });
  ```
- Then inside the UseDocs() method > app.UseSwaggerUI(), add this:
  ```csharp
      c.InjectStylesheet("/swagger-ui/theme/universal-dark.css");
  ```

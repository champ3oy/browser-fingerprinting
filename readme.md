# Browser Fingerprinting

A simple robust browser fingerprinting library for tracking users across sessions and domains.

## Features

- Stable cross-session identification
- Hardware/software fingerprinting
- API key authentication
- cross-domain cookies support

## Usage

### Basic Usage

```javascript
Fingerprint.load({
  apiKey: "any-string",
  debug: true,
})
  .then((bf) => bf.get())
  .then((result) => {
    console.log(result.visitorId);
  });
```

### With Cross-Domain Cookies

```javascript
Fingerprint.load({
  apiKey: "any-string",
  cookieName: "visitor_id",
  cookieDays: 365,
  domains: [".app.example.com", ".api.example.com"],
});
```

## Components

components used for fingerprinting:

- Hardware info (CPU cores, memory, GPU)
- Browser characteristics
- Screen properties
- Font detection
- Canvas fingerprinting
- WebGL capabilities
- System language

## Example

Check [example.html](example.html)

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    return new NextResponse(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({ success: false, error: 'access_denied' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }

  try {
    // In a real implementation, you would:
    // 1. Exchange the code for an access token
    // 2. Fetch user/agent information from the provider
    // 3. Store the connection in your database
    // 4. Associate it with the current user

    // For demo purposes, we'll simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Close the popup and notify parent window
    return new NextResponse(
      `
      <html>
        <body>
          <div style="font-family: system-ui; text-align: center; padding: 50px;">
            <h2>✅ Connection Successful!</h2>
            <p>Your ${provider} agent has been connected.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.opener.postMessage({ success: true, provider: '${provider}' }, '*');
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  } catch (error) {
    console.error("OAuth callback error:", error)

    return new NextResponse(
      `
      <html>
        <body>
          <div style="font-family: system-ui; text-align: center; padding: 50px;">
            <h2>❌ Connection Failed</h2>
            <p>There was an error connecting your ${provider} agent.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.opener.postMessage({ success: false, error: 'oauth_failed' }, '*');
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }
}

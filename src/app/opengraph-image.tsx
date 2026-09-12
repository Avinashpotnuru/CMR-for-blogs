import { ImageResponse } from "next/og"
import { AUTHOR_NAME, SITE_NAME } from "@/lib/site"

export const alt = "Mini Blog — The Journal"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f2ea",
          padding: 72,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#26303a",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
              padding: 12,
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                width: "100%",
                height: 3,
                backgroundColor: "#f7f2ea",
                display: "block",
              }}
            />
            <span
              style={{
                width: "100%",
                height: 3,
                backgroundColor: "#f7f2ea",
                display: "block",
              }}
            />
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#e5436f",
                display: "block",
                marginTop: 2,
              }}
            />
          </span>
          <span
            style={{
              fontSize: 30,
              color: "#26303a",
            }}
          >
            {SITE_NAME}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 900,
          }}
        >
          <span
            style={{
              fontSize: 68,
              lineHeight: 1.08,
              color: "#26303a",
              fontWeight: 600,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Field notes on development, design, and the long, patient work of
            building for the web.
          </span>
          <span
            style={{
              marginTop: 28,
              fontSize: 22,
              color: "#8a8f98",
            }}
          >
            Written by {AUTHOR_NAME}
          </span>
        </div>
      </div>
    ),
    size,
  )
}
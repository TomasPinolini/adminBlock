import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const size = parseInt(searchParams.get("size") || "192", 10)
  const fontSize = Math.floor(size * 0.6)
  const borderRadius = Math.floor(size * 0.15)

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: fontSize,
          background: "#2ea3f2",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
          borderRadius: borderRadius,
        }}
      >
        B
      </div>
    ),
    { width: size, height: size }
  )
}

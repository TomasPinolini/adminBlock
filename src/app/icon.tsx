import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 192, height: 192 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: "#2ea3f2",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
          borderRadius: 32,
        }}
      >
        B
      </div>
    ),
    { ...size }
  )
}

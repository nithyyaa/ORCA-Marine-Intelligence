export async function GET() {
  return Response.json({
    success: true,
    message: "TTS endpoint available",
  });
}
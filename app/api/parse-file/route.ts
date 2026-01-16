import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Only plain text files are supported for now
        if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
            return NextResponse.json(
                { error: "Only TXT files are supported at this time. PDF and DOCX capabilities coming soon." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = buffer.toString("utf-8");

        if (!text.trim()) {
            return NextResponse.json(
                { error: "File appears to be empty or could not be read" },
                { status: 400 }
            );
        }

        return NextResponse.json({ text });
    } catch (error) {
        console.error("Error parsing file:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to parse file" },
            { status: 500 }
        );
    }
}

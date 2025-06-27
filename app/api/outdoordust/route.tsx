import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch(
            "https://api.waqi.info/feed/@3688/?token=033f273aed8762fc1af041c2f8c4ffc67bda9cfb"
        );
        const data = await response.json();

        if (data.status === "ok") {
            return NextResponse.json({
                aqi: data.data.aqi,
                pm25: data.data.iaqi.pm25?.v || null,
            });
        } else {
            return NextResponse.json(
                { error: "Error fetching data from AQI API" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error fetching AQI data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
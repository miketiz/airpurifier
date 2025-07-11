import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { connection_key } = body;
    if (!connection_key) {
        return NextResponse.json({ success: false, message: "Missing connection_key" }, { status: 400 });
    }
    const user_id = session.user.id;
    try {
        const res = await axios.delete("http://172.25.11.111:8000/devices/delete_device", {
            data: { user_id, connection_key }
        });
        return NextResponse.json({ success: true, data: res.data });
    } catch (err) {
        console.error("API error", err);
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });}
    }
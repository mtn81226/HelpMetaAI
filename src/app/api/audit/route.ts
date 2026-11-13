import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB, { isMongoConnectionError } from '../../../lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const auditLogs = await db
      .collection('ticket_audit')
      .find({})
      .sort({ _id: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({
      success: true,
      count: auditLogs.length,
      auditLogs,
    });
  } catch (error: any) {
    console.error('GET /api/audit error:', error);
    const unavailable = isMongoConnectionError(error);
    return NextResponse.json(
      {
        success: false,
        error: unavailable
          ? 'Không thể kết nối cơ sở dữ liệu MongoDB Atlas'
          : 'Lỗi khi tải danh sách Audit Log',
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}

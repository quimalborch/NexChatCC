import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const chats = await prisma.chats.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        createdAt: true,
        // add other fields except secret_key
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    console.error('Error al obtener chats:', error);
    return NextResponse.json(
      { error: 'Error al obtener los chats' },
      { status: 500 }
    );
  }
}
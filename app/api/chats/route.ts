import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function generateSecretKey(): string {
  return randomBytes(32).toString('hex');
}

export async function GET() {
  try {
    const chats = await prisma.chats.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        createdAt: true,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url } = body;

    // Validar que los campos requeridos estén presentes
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Los campos "name" y "url" son requeridos' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        const response = await fetch(`${url}/ping`, { method: 'HEAD' });
        if (response.status !== 200) {
          return NextResponse.json(
          { error: 'La URL proporcionada no está activa' },
          { status: 400 }
          );
      }
      } catch (error) {
        return NextResponse.json(
          { error: 'Error al verificar la URL proporcionada' },
          { status: 400 }
        );
      }
    }

    // Generar la secret_key automáticamente
    const secret_key = generateSecretKey();

    const chat = await prisma.chats.create({
      data: {
        name,
        url,
        secret_key,
      },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error('Error al crear chat:', error);
    return NextResponse.json(
      { error: 'Error al crear el chat' },
      { status: 500 }
    );
  }
}
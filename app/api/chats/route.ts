import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function generateSecretKey(): string {
  return randomBytes(32).toString('hex');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Validar que los parámetros sean válidos
    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: 'Los parámetros "page" y "pageSize" deben ser mayores a 0' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * pageSize;

    // Obtener el total de chats
    const total = await prisma.chats.count();

    // Obtener los chats paginados
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
      skip: skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: chats,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    }, { status: 200 });
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret_key = searchParams.get('secret_key');

    // Validar que la secret_key esté presente
    if (!secret_key) {
      return NextResponse.json(
        { error: 'El parámetro "secret_key" es requerido' },
        { status: 400 }
      );
    }

    const result = await prisma.chats.deleteMany({
      where: {
        secret_key: secret_key,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'El chat no existe o la secret_key es incorrecta' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Chat eliminado correctamente'},
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar chat:', error);
    
    return NextResponse.json(
      { error: 'Error al eliminar el chat' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { secret_key, name } = body;
    // Validar que los campos requeridos estén presentes
    if (!secret_key || !name) {
      return NextResponse.json(
        { error: 'Los campos "secret_key" y "name" son requeridos' },
        { status: 400 }
      );
    }

    const updatedChat = await prisma.chats.updateMany({
      where: {
        secret_key: secret_key,
      },
      data: {
        name: name,
      },
    });

    if (updatedChat.count === 0) {
      return NextResponse.json(
        { error: 'El chat no existe o la secret_key es incorrecta' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Nombre del chat actualizado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar el nombre del chat:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el nombre del chat' },
      { status: 500 }
    );
  }
}
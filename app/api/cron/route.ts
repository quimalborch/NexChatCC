import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
    if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) 
    {
        return new Response("Unauthorized", {status: 401,});  
    }

    try {
        // Obtener todos los chats
        const chats = await prisma.chats.findMany({
            select: {
                id: true,
                name: true,
                url: true,
                secret_key: true,
            },
        });

        const results = {
            total: chats.length,
            checked: 0,
            deleted: 0,
            deletedChats: [] as string[],
        };

        // Verificar cada chat con ping
        for (const chat of chats) {
            results.checked++;
            try {
                //console.log(`Verificando la URL del chat: https://${chat.url}.trycloudflare.com/ping`);
                const response = await fetch(`https://${chat.url}.trycloudflare.com/ping`, { 
                    method: 'GET',
                    signal: AbortSignal.timeout(5000), 
                });
                
                if (response.status !== 200) {
                    await prisma.chats.delete({
                        where: { id: chat.id },
                    });
                    results.deleted++;
                    results.deletedChats.push(chat.name);
                }
            } catch (error) {
                await prisma.chats.delete({
                    where: { id: chat.id },
                });
                results.deleted++;
                results.deletedChats.push(chat.name);
            }
        }

        return NextResponse.json({ 
            ok: true,
            ...results,
        });
    } catch (error) {
        console.error('Error en cron job:', error);
        return NextResponse.json(
            { ok: false, error: 'Error al ejecutar el cron job' },
            { status: 500 }
        );
    }
}
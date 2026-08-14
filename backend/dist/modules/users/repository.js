import prisma from '../../lib/prisma.js';
function toUserResponse(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
export async function findAllUsers() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return users.map(toUserResponse);
}
export async function findUserById(id) {
    return prisma.user.findUnique({ where: { id } });
}
export async function findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}
export async function createUser(data) {
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            role: data.role,
            active: true,
        },
    });
    return toUserResponse(user);
}
export async function updateUser(id, data) {
    const user = await prisma.user.update({
        where: { id },
        data,
    });
    return toUserResponse(user);
}
//# sourceMappingURL=repository.js.map
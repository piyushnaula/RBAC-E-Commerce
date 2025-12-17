import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Platform administrator with full access',
        },
    });

    const merchantRole = await prisma.role.upsert({
        where: { name: 'Merchant' },
        update: {},
        create: {
            name: 'Merchant',
            description: 'Vendor/Seller who can manage their store and products',
        },
    });

    const customerRole = await prisma.role.upsert({
        where: { name: 'Customer' },
        update: {},
        create: {
            name: 'Customer',
            description: 'Regular customer who can browse and purchase',
        },
    });

    const financeRole = await prisma.role.upsert({
        where: { name: 'Finance' },
        update: {},
        create: {
            name: 'Finance',
            description: 'Finance team member who can manage refunds and settlements',
        },
    });

    const supportRole = await prisma.role.upsert({
        where: { name: 'Support' },
        update: {},
        create: {
            name: 'Support',
            description: 'Support agent who can view orders and help customers',
        },
    });

    console.log('✅ Roles created:', { adminRole, merchantRole, customerRole, financeRole, supportRole });

    // Create permissions
    const permissions = [
        // User permissions
        { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
        { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
        { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
        { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },

        // Product permissions
        { name: 'products:read', resource: 'products', action: 'read', description: 'View products' },
        { name: 'products:create', resource: 'products', action: 'create', description: 'Create products' },
        { name: 'products:update', resource: 'products', action: 'update', description: 'Update products' },
        { name: 'products:delete', resource: 'products', action: 'delete', description: 'Delete products' },

        // Order permissions
        { name: 'orders:read', resource: 'orders', action: 'read', description: 'View orders' },
        { name: 'orders:create', resource: 'orders', action: 'create', description: 'Create orders' },
        { name: 'orders:update', resource: 'orders', action: 'update', description: 'Update orders' },

        // Vendor permissions
        { name: 'vendors:read', resource: 'vendors', action: 'read', description: 'View vendors' },
        { name: 'vendors:create', resource: 'vendors', action: 'create', description: 'Create vendors' },
        { name: 'vendors:update', resource: 'vendors', action: 'update', description: 'Update vendors' },

        // Refund permissions
        { name: 'refunds:read', resource: 'refunds', action: 'read', description: 'View refunds' },
        { name: 'refunds:create', resource: 'refunds', action: 'create', description: 'Request refunds' },
        { name: 'refunds:approve', resource: 'refunds', action: 'approve', description: 'Approve refunds' },

        // RBAC permissions
        { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
        { name: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: {},
            create: perm,
        });
    }

    console.log('✅ Permissions created');

    // Assign permissions to Admin role (all permissions)
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: perm.id,
            },
        });
    }

    // Assign permissions to Merchant role
    const merchantPerms = ['products:read', 'products:create', 'products:update', 'products:delete',
        'orders:read', 'orders:update', 'vendors:read', 'vendors:create', 'vendors:update'];
    for (const permName of merchantPerms) {
        const perm = await prisma.permission.findUnique({ where: { name: permName } });
        if (perm) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: merchantRole.id, permissionId: perm.id },
                },
                update: {},
                create: { roleId: merchantRole.id, permissionId: perm.id },
            });
        }
    }

    // Assign permissions to Customer role
    const customerPerms = ['products:read', 'orders:read', 'orders:create', 'refunds:create'];
    for (const permName of customerPerms) {
        const perm = await prisma.permission.findUnique({ where: { name: permName } });
        if (perm) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: customerRole.id, permissionId: perm.id },
                },
                update: {},
                create: { roleId: customerRole.id, permissionId: perm.id },
            });
        }
    }

    // Assign permissions to Finance role
    const financePerms = ['refunds:read', 'refunds:approve', 'orders:read'];
    for (const permName of financePerms) {
        const perm = await prisma.permission.findUnique({ where: { name: permName } });
        if (perm) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: financeRole.id, permissionId: perm.id },
                },
                update: {},
                create: { roleId: financeRole.id, permissionId: perm.id },
            });
        }
    }

    console.log('✅ Role permissions assigned');
    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UserRole, UserStatus } from '@prisma/client';

function generateReferralCode(): string {
  return 'UAU-' + randomBytes(3).toString('hex').toUpperCase();
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCustomerDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já está em uso');
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { cpf: createDto.cpf },
    });

    if (existingCustomer) {
      throw new ConflictException('CPF já está em uso');
    }

    const passwordHash = await bcrypt.hash(createDto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: createDto.name,
          email: createDto.email,
          passwordHash,
          role: UserRole.CUSTOMER,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          cpf: createDto.cpf,
          phone: createDto.phone,
          referralCode: generateReferralCode(),
        },
      });

      // Cria a carteira automaticamente
      await tx.wallet.create({
        data: { customerId: customer.id },
      });

      return { user, customer };
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        user: { select: { name: true, email: true, status: true } },
        vehicles: true,
        subscriptions: { where: { status: 'ACTIVE' } },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, status: true } },
        vehicles: true,
        subscriptions: true,
        wallet: true,
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async activate(id: string) {
    const customer = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: customer.userId },
      data: { status: UserStatus.ACTIVE },
      select: { id: true, status: true },
    });
  }

  async block(id: string) {
    const customer = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: customer.userId },
      data: { status: UserStatus.BLOCKED },
      select: { id: true, status: true },
    });
  }

  async markSuspect(id: string) {
    const customer = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: customer.userId },
      data: { status: UserStatus.SUSPECT },
      select: { id: true, status: true },
    });
  }

  async update(id: string, updateDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (updateDto.name || updateDto.email || updateDto.status) {
        await tx.user.update({
          where: { id: customer.userId },
          data: {
            name: updateDto.name,
            email: updateDto.email,
            status: updateDto.status,
          },
        });
      }

      return tx.customer.update({
        where: { id },
        data: {
          cpf: updateDto.cpf,
          phone: updateDto.phone,
        },
        include: { user: true },
      });
    });
  }
}

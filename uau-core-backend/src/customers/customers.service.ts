import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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

  async findAll(dto: ListCustomersDto) {
    const { page, limit, search, status } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      ...(status && { user: { status } }),
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { cpf: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, status: true } },
          vehicles: true,
          subscriptions: { where: { status: 'ACTIVE' } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginate(data, total, page, limit);
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

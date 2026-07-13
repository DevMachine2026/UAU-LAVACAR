import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  const buildController = (queryRaw: jest.Mock) => {
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    return new AppController(prisma);
  };

  describe('health', () => {
    it('retorna status ok sem tocar o banco', () => {
      const queryRaw = jest.fn();
      const result = buildController(queryRaw).health();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toEqual(expect.any(String));
      expect(queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('retorna status ready quando o banco responde', async () => {
      const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
      const result = await buildController(queryRaw).ready();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toEqual(expect.any(String));
      expect(queryRaw).toHaveBeenCalledTimes(1);
    });

    it('retorna 503 quando o banco nao responde', async () => {
      const queryRaw = jest.fn().mockRejectedValue(new Error('connection refused'));

      await expect(buildController(queryRaw).ready()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});

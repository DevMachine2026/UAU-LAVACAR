import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CameraEventDto {
  @IsString()
  @IsNotEmpty()
  cameraId: string; // Identificador da câmera no sistema

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsOptional()
  confidence?: string; // Grau de confiança da leitura (ex: "98.5")

  @IsString()
  @IsOptional()
  photoUrl?: string; // URL da foto da placa, se o DVR/câmera enviar
}

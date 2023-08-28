import { IsNotEmpty, IsString } from 'class-validator';
import { Exclude, Transform, Type } from 'class-transformer';

export class UserEntity {
  id: string;

  @IsNotEmpty()
  @IsString()
  login: string;

  version: number;

  @Exclude()
  password: string;

  @Transform(({ value }) => new Date(value).getTime())
  createdAt: number;

  @Transform(({ value }) => new Date(value).getTime())
  updatedAt: number;

  constructor(
    partial: Pick<
      Partial<UserEntity>,
      'id' | 'login' | 'version' | 'password'
    > & {
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    Object.assign(this, partial);
  }
}

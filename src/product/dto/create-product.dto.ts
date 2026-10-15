import { IsNotEmpty, IsNumber, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(200, { message: 'Tên sản phẩm tối đa 200 ký tự' })
  name: string;

  @IsNumber({}, { message: 'Giá phải là một con số' })
  @Min(0, { message: 'Giá sản phẩm không được âm' })
  price: number;

  @IsUrl({}, { message: 'Ảnh sản phẩm phải là một URL hợp lệ' })
  image: string;
}

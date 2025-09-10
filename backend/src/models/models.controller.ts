import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BullMQService } from '../jobs/bullmq.service'; // Assuming a service to dispatch jobs
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// This is a placeholder service. In a real app, this would handle DB interactions.
@Injectable()
export class ModelsService {
  async create(file: any, userId: string) {
    // 1. Save file metadata to 'models' table in DB
    // 2. Upload file to S3
    // 3. Return the model ID
    const modelId = '...'; // generate UUID
    console.log(`Model created for user ${userId} with file ${file.originalname}`);
    return { id: modelId, s3_key: `...` };
  }
}


@ApiTags('Models')
@Controller('models')
export class ModelsController {
  constructor(
    private readonly modelsService: ModelsService,
    @Inject('BullMQService') private readonly bullMqService: BullMQService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '3D model file (STL, OBJ, GLB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    // Security: Store temporarily, do not use originalname directly
    storage: diskStorage({
      destination: './uploads_tmp',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadModel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100 MB
          new FileTypeValidator({ fileType: /(stl|obj|glb)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any, // In a real app, req.user would be populated by the JWT guard
  ) {
    // In a real app, the userId would come from the validated JWT token
    const userId = req.user.userId;

    // 1. Create a record for the model in the database
    // This would typically be handled in a service that also uploads to S3
    // const model = await this.modelsService.create(file, userId);
    console.log('File uploaded:', file.path);
    const model = { id: 'generated-uuid-placeholder', s3_key: `uploads/${file.filename}` };


    // 2. Dispatch a job for asynchronous analysis
    await this.bullMqService.addJob('analyze-model', {
      modelId: model.id,
      filePath: file.path, // Path to the temporarily stored file
      s3_key: model.s3_key,
    });

    return {
      message: 'Model nahrán, analýza byla spuštěna.',
      model_id: model.id,
    };
  }
}

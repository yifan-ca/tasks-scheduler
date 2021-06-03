import { Injectable, Logger, } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Credential, CredentialDocument, CredentialStatus } from '../credentials/schemas/credential.schema';
import * as crypto from 'crypto'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name); 

    constructor(
        private configService: ConfigService,
        @InjectModel(Credential.name) private credentialModel: Model<CredentialDocument>) { }

    validate(apiKey: string, apiSecret: string): Promise<void> {
        const expectedApiSecret = crypto.createHmac('sha256', this.configService.get<string>('SECRET_KEY'))
            .update(apiKey).digest('hex')
        return new Promise((resolve, reject) => {
            return this.credentialModel.findOne({ apiKey })
                .then((credential: CredentialDocument) => {
                    if (!credential || credential.status !== CredentialStatus.Enable) {
                        return reject()
                    }
                    if (expectedApiSecret !== apiSecret) {
                        return reject()
                    }
                })
                .then(() => resolve())
                .catch(() => reject())
        })
    }
}
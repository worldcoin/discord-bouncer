import { ISuccessResult } from '@worldcoin/idkit'
import { APIRole } from 'discord-api-types/v10'

export type VerificationCompletePayload = {
  guildId: string
  userId: string
  token: string
  result: ISuccessResult
}

export type VerificationCompleteResponsePayload = {
  assignedRoles: APIRole[]
}

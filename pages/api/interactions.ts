import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders'
import {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponsePong,
  APIPingInteraction,
  ButtonStyle,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10'
import type { NextApiRequest, NextApiResponse } from 'next'
import { isPingInteraction, verifyInteractionSignature } from 'services/discord'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<APIInteractionResponse>) {
  const signature = req.headers['x-signature-ed25519']
  const timestamp = req.headers['x-signature-timestamp']

  if (typeof signature !== 'string' || typeof timestamp !== 'string') {
    return res.status(401).end('invalid request signature')
  }
  const rawBody = await new Promise<string>((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      resolve(Buffer.from(data).toString())
    })
  })
  const isVerified = verifyInteractionSignature(rawBody, signature, timestamp)

  if (!isVerified) {
    return res.status(401).end('invalid request signature')
  }

  const data = JSON.parse(rawBody) as APIApplicationCommandInteraction | APIPingInteraction
  if (isPingInteraction(data)) {
    const payload: APIInteractionResponsePong = {
      type: InteractionResponseType.Pong,
    }
    return res.status(200).json(payload)
  }

  const embed = new EmbedBuilder().setColor([133, 126, 245]).setTitle('Open this page to verify')

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Verify')
      .setStyle(ButtonStyle.Link)
      .setURL(`${process.env.NEXTAUTH_URL}/verification?user_id=${data.member?.user.id}&guild_id=${data.guild_id}`),
  )

  // FIXME: implement verification
  const payload: APIInteractionResponseChannelMessageWithSource = {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [embed.toJSON()],
      components: [row.toJSON()],
      flags: MessageFlags.Ephemeral,
    },
  }
  return res.status(200).json(payload)
}

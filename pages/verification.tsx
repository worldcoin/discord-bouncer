import {findRoles} from 'helpers'
import {GetServerSideProps} from 'next'
import {getGuildData} from 'services/discord'
import {getBotConfig} from 'services/dynamodb'
import {Verification} from 'Verification'
export default Verification

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const {user_id, guild_id} = ctx.query

  if (!user_id || !guild_id) {
    return {
      props: {
        guild: null,
        rolesToAssign: null,
        userId: null,
      },
    }
  }

  const guild = await getGuildData(guild_id as string)
  const botConfig = (await getBotConfig(guild_id as string)).data

  if (!botConfig) {
    return {
      props: {
        guild,
        userId: user_id,
      },
    }
  }

  const rolesToAssign = {
    phone: findRoles(botConfig.phone.roles, guild.roles),
    orb: findRoles(botConfig.orb.roles, guild.roles),
  }

  return {
    props: {
      guild,
      rolesToAssign,
      userId: user_id,
    },
  }
}

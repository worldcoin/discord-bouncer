import cn from 'classnames'
import { Button } from 'common/Button'
import { GuildLabel } from 'common/GuildLabel'
import { Header } from 'common/Header'
import { Layout } from 'common/Layout'
import { Modal } from 'common/Modal'
import { BotConfig } from 'common/types'
import { APIGuild, APIRole } from 'discord-api-types/v10'
import { generateGuildImage } from 'helpers'
import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { RolesSelector } from './RolesSelector'
import { StyledCheckbox } from './StyledCheckbox'
import type { Option } from './types/option'

export const Admin = memo(function Admin(props: {
  roles: APIRole[]
  guild: APIGuild
  initialConfig: BotConfig<'initial'>
}) {
  const [roles, setRoles] = useState<Array<Option>>(() => {
    return props.roles.map((role) => ({
      label: role.name,
      value: role.id,
    }))
  })

  const [selectedPhoneRoles, setSelectedPhoneRoles] = useState<Array<Option>>(props.initialConfig?.phone.roles || [])
  const [selectedOrbRoles, setSelectedOrbRoles] = useState<Array<Option>>(props.initialConfig?.orb.roles || [])
  const [savingInProgress, setSavingInProgress] = useState(false)
  const [savedSuccessfully, setSavedSuccessfully] = useState<boolean | null>(null)
  const [isBotEnabled, setIsBotEnabled] = useState(props.initialConfig?.enabled || false)
  const [isOrbVerificationEnabled, setIsOrbVerificationEnabled] = useState(props.initialConfig?.orb.enabled || false)

  const [isPhoneVerificationEnabled, setIsPhoneVerificationEnabled] = useState(
    props.initialConfig?.phone.enabled || false,
  )

  // NOTE: Removes saving status message from page after 3 seconds
  useEffect(() => {
    if (savedSuccessfully === null) {
      return
    }

    const timer = setTimeout(() => {
      setSavedSuccessfully(null)
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [savedSuccessfully])

  const botConfig: BotConfig = useMemo(
    () => ({
      enabled: isBotEnabled,
      guild_id: props.initialConfig.guild_id,

      phone: {
        enabled: isPhoneVerificationEnabled,
        roles: selectedPhoneRoles.map((role) => role.value),
      },

      orb: {
        enabled: isOrbVerificationEnabled,
        roles: selectedOrbRoles.map((role) => role.value),
      },
    }),
    [
      isBotEnabled,
      isOrbVerificationEnabled,
      isPhoneVerificationEnabled,
      props.initialConfig.guild_id,
      selectedOrbRoles,
      selectedPhoneRoles,
    ],
  )

  const formIsClean = useMemo(() => {
    return (
      isBotEnabled === props.initialConfig?.enabled &&
      isPhoneVerificationEnabled === props.initialConfig?.phone.enabled &&
      isOrbVerificationEnabled === props.initialConfig?.orb.enabled &&
      selectedPhoneRoles.length === props.initialConfig?.phone.roles.length &&
      selectedOrbRoles.length === props.initialConfig?.orb.roles.length
    )
  }, [
    isBotEnabled,
    isOrbVerificationEnabled,
    isPhoneVerificationEnabled,
    props.initialConfig,
    selectedOrbRoles.length,
    selectedPhoneRoles.length,
  ])

  const saveChanges = useCallback(() => {
    setSavingInProgress(true)

    if (selectedPhoneRoles.length === 0 && selectedOrbRoles.length === 0) {
      setSavingInProgress(false)
      return setSavedSuccessfully(false)
    }

    fetch('/api/dynamodb/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botConfig),
    })
      .then((response) => {
        if (response.ok) {
          setSavedSuccessfully(true)
        } else {
          setSavedSuccessfully(false)
        }

        setSavingInProgress(false)
      })
      .catch((error) => {
        console.error('Error:', error)
        setSavedSuccessfully(false)
        setSavingInProgress(false)
      })
  }, [botConfig, selectedOrbRoles.length, selectedPhoneRoles.length])

  const formValid = useMemo(() => {
    return selectedPhoneRoles.length > 0 || selectedOrbRoles.length > 0
  }, [selectedOrbRoles, selectedPhoneRoles])

  const guildImage = useMemo(() => {
    return generateGuildImage(props.guild.id, props.guild.icon)
  }, [props.guild.icon, props.guild.id])

  return (
    <Layout title="Configuration" className="bg-0d1020 flex justify-center items-center relative min-h-screen">
      <Image src="/images/admin/background.svg" alt="Background" fill className="object-cover" />
      <Header hideLinks onTop />

      <Modal loading={false}>
        <div className="relative grid justify-center auto-cols-max items-center p-6 border-b border-[color:inherit]">
          <div className="grid gap-y-3 justify-items-center w-full">
            <span className="text-20 font-semibold">Discord Bouncer Admin</span>
            <GuildLabel image={guildImage} name={props.guild?.name ?? 'Your guild'} />
          </div>

          <StyledCheckbox isOn={isBotEnabled} setIsOn={setIsBotEnabled} className="absolute top-6 right-6" />
        </div>

        <div className="grid grid-cols-[100%] gap-y-8.5 px-8 pt-12 pb-4">
          <div className="grid gap-y-2">
            <span>Credentials</span>

            <p className="font-rubik text-14 text-ffffff/40">
              The server configuration allows you to manage the various components of your Discord Bouncer.
            </p>
          </div>

          <div className="grid gap-y-8">
            <RolesSelector
              icon="mobile-device"
              name="Phone Number"
              description="A single-use code will be delivered via SMS."
              className="mt-4"
              roles={roles}
              setRoles={setRoles}
              selectedRoles={selectedPhoneRoles}
              setSelectedRoles={setSelectedPhoneRoles}
              isEnabled={isPhoneVerificationEnabled}
              setIsEnabled={setIsPhoneVerificationEnabled}
            />

            <RolesSelector
              icon="orb"
              name="Orb"
              description="Completely private iris imaging with a device called an orb."
              className="mt-4"
              roles={roles}
              setRoles={setRoles}
              selectedRoles={selectedOrbRoles}
              setSelectedRoles={setSelectedOrbRoles}
              isEnabled={isOrbVerificationEnabled}
              setIsEnabled={setIsOrbVerificationEnabled}
            />
          </div>

          <div className="grid justify-items-center gap-y-4 mt-12">
            <Button
              className="w-full font-sora disabled:opacity-20 disabled:cursor-not-allowed"
              disabled={formIsClean || !formValid || savingInProgress}
              onClick={saveChanges}
            >
              {savingInProgress ? 'Saving...' : 'Save changes'}
            </Button>

            <span
              className={cn(
                'transition-visibility/opacity col-start-1 row-start-2',
                { 'visible opacity-100': savedSuccessfully === true },
                { 'invisible opacity-0': savedSuccessfully !== true },
              )}
            >
              Your changes have been successfully saved!
            </span>

            <span
              className={cn(
                'transition-visibility/opacity col-start-1 row-start-2 text-red-500',
                { 'visible opacity-100': savedSuccessfully === false },
                { 'invisible opacity-0': savedSuccessfully !== false },
              )}
            >
              Something went wrong. Try again, please.
            </span>
          </div>
        </div>
      </Modal>
    </Layout>
  )
})

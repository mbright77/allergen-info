import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'
import { ProfileEditor } from './ProfileEditor'

export function ProfilePage() {
  const { t } = useTranslation('profile')
  const { activeProfile, updateActiveProfile } = useProfile()

  usePageTitle(activeProfile ? t('Page.EditTitle', { name: activeProfile.name }) : t('Page.Title'))

  if (!activeProfile) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <ProfileEditor
      mode="edit"
      initialName={activeProfile.name}
      initialSelectedAllergens={activeProfile.selectedAllergens}
      saveLabel={t('Edit.Save')}
      introEyebrow={t('Edit.Eyebrow')}
      introTitle={t('Edit.Title', { name: activeProfile.name })}
      introDescription={t('Edit.Description')}
      onSave={updateActiveProfile}
    />
  )
}

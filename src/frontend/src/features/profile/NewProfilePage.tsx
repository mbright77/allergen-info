import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'
import { ProfileEditor } from './ProfileEditor'

export function NewProfilePage() {
  const { t } = useTranslation('profile')
  const navigate = useNavigate()
  const { createProfile } = useProfile()

  usePageTitle(t('Create.Title'))

  return (
    <ProfileEditor
      mode="create"
      initialName=""
      initialSelectedAllergens={[]}
      saveLabel={t('Create.Save')}
      introEyebrow={t('Create.Eyebrow')}
      introTitle={t('Create.Title')}
      introDescription={t('Create.Description')}
      onSave={({ name, selectedAllergens }) => {
        createProfile({ name, selectedAllergens })
        navigate('/profile')
      }}
    />
  )
}

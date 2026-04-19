import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ProfileEditor } from '../profile/ProfileEditor'
import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'

export function OnboardingPage() {
  const { t } = useTranslation('onboarding')
  const navigate = useNavigate()
  const { createProfile } = useProfile()

  usePageTitle(t('Page.Title'))

  return (
    <div className="onboarding-page">
      <ProfileEditor
        mode="create"
        initialName=""
        initialSelectedAllergens={[]}
        saveLabel={t('Actions.Save')}
        introEyebrow={t('Intro.Eyebrow')}
        introTitle={t('Intro.Title')}
        introDescription={t('Intro.Description')}
        onSave={({ name, selectedAllergens }) => {
          createProfile({ name, selectedAllergens })
          navigate('/home')
        }}
      />
    </div>
  )
}

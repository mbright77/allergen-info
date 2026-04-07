import { useNavigate } from 'react-router-dom'

import { ProfileEditor } from '../profile/ProfileEditor'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { createProfile } = useProfile()

  return (
    <div className="onboarding-page">
      <ProfileEditor
        mode="create"
        initialName=""
        initialSelectedAllergens={[]}
        saveLabel="Save profile and continue"
        introEyebrow="First profile"
        introTitle="Create your Safe Zone"
        introDescription="Name the first profile for yourself or a family member. You can leave allergens empty for now and update them later from the profile screen."
        onSave={({ name, selectedAllergens }) => {
          createProfile({ name, selectedAllergens })
          navigate('/home')
        }}
      />
    </div>
  )
}

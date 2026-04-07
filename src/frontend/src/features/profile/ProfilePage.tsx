import { Navigate } from 'react-router-dom'

import { useProfile } from '../../shared/profile/ProfileProvider'
import { ProfileEditor } from './ProfileEditor'

export function ProfilePage() {
  const { activeProfile, updateActiveProfile } = useProfile()

  if (!activeProfile) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <ProfileEditor
      mode="edit"
      initialName={activeProfile.name}
      initialSelectedAllergens={activeProfile.selectedAllergens}
      saveLabel="Save profile changes"
      introEyebrow="Profile"
      introTitle={`Adjust ${activeProfile.name}.`}
      introDescription="This screen edits the profile that is currently active in the top bar. Changes apply to future search, scan, and result analysis."
      onSave={updateActiveProfile}
    />
  )
}

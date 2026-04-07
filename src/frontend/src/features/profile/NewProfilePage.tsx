import { useNavigate } from 'react-router-dom'

import { useProfile } from '../../shared/profile/ProfileProvider'
import { ProfileEditor } from './ProfileEditor'

export function NewProfilePage() {
  const navigate = useNavigate()
  const { createProfile } = useProfile()

  return (
    <ProfileEditor
      mode="create"
      initialName=""
      initialSelectedAllergens={[]}
      saveLabel="Save new profile"
      introEyebrow="Add profile"
      introTitle="Add another profile"
      introDescription="Create another named profile for a family member or a different allergy setup. You can save it empty and tailor allergens later."
      onSave={({ name, selectedAllergens }) => {
        createProfile({ name, selectedAllergens })
        navigate('/profile')
      }}
    />
  )
}

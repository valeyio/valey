import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/lib/AuthContext'
import { supabaseClient } from '@/lib/useSupabase'
import {
  Camera,
  Save,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/components/ui/button'
import { Input } from '@/components/components/ui/input'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/components/ui/avatar'

// Security: Input validation schemas
const VALIDATION_RULES = {
  firstName: {
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    required: false,
  },
  lastName: {
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    required: false,
  },
  phone: {
    maxLength: 20,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    required: false,
  },
  company: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s&.,'-]+$/,
    required: false,
  },
} as const

// Security: File validation constants
const AVATAR_VALIDATION = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
} as const

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  avatar_url: string
}

interface ValidationError {
  field: string
  message: string
}

// Phone number formatting functions
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, '')

  // Don't format if empty
  if (!phoneNumber) return ''

  // Format based on length
  if (phoneNumber.length <= 3) {
    return `(${phoneNumber}`
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }
}

const unformatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters for storage
  return value.replace(/\D/g, '')
}

const isValidPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '')
  return digits.length === 0 || digits.length === 10
}

export default function ProfilePage() {
  const { user, profile, isLoading, refreshProfile, updateProfile } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    avatar_url: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  )

  // Performance: Memoize computed values
  const firstName = useMemo(
    () => profile?.first_name || user?.email?.split('@')[0] || 'User',
    [profile?.first_name, user?.email]
  )

  // Security: Input validation function
  const validateField = useCallback(
    (field: keyof typeof VALIDATION_RULES, value: string): string | null => {
      const rules = VALIDATION_RULES[field]
      if (!rules) return null

      if (rules.required && !value.trim()) {
        return `${field} is required`
      }

      if (value && value.length > rules.maxLength) {
        return `${field} must be less than ${rules.maxLength} characters`
      }

      // Special validation for phone
      if (field === 'phone' && value) {
        if (!isValidPhoneNumber(value)) {
          return 'Phone number must be 10 digits'
        }
      } else if (value && !rules.pattern.test(value)) {
        return `${field} contains invalid characters`
      }

      return null
    },
    []
  )

  // Security: Comprehensive form validation
  const validateForm = useCallback(
    (data: FormData): ValidationError[] => {
      const errors: ValidationError[] = []

      // Validate each field
      Object.entries(VALIDATION_RULES).forEach(([field, _]) => {
        const fieldKey =
          field === 'firstName'
            ? 'first_name'
            : field === 'lastName'
              ? 'last_name'
              : (field as keyof FormData)

        let valueToValidate = data[fieldKey]

        // For phone, validate the unformatted version
        if (field === 'phone') {
          valueToValidate = unformatPhoneNumber(data[fieldKey])
        }

        const error = validateField(
          field as keyof typeof VALIDATION_RULES,
          valueToValidate
        )
        if (error) {
          errors.push({ field: fieldKey, message: error })
        }
      })

      return errors
    },
    [validateField]
  )

  // Security: Sanitize input function
  const sanitizeInput = useCallback((value: string): string => {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .substring(0, 200) // Limit length
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (profile && user) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: user.email || '',
        phone: profile.phone ? formatPhoneNumber(profile.phone) : '',
        company: profile.company || '',
        avatar_url: profile.avatar_url || '',
      })
    }
  }, [profile, user])

  // Performance: Enhanced input change handler with phone formatting
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target

      let processedValue = value

      // Special handling for phone number
      if (name === 'phone') {
        processedValue = formatPhoneNumber(value)
      } else {
        processedValue = sanitizeInput(value)
      }

      setFormData((prev) => ({ ...prev, [name]: processedValue }))

      // Clear validation errors for this field
      setValidationErrors((prev) =>
        prev.filter((error) => error.field !== name)
      )
    },
    [sanitizeInput]
  )

  // Security: Enhanced avatar upload with comprehensive validation
  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !user) return

      // Security: Comprehensive file validation
      if (file.size > AVATAR_VALIDATION.maxSize) {
        setMessage('Error: File size must be less than 5MB.')
        return
      }

      if (!AVATAR_VALIDATION.allowedTypes.includes(file.type as any)) {
        setMessage(
          'Error: Please select a valid image file (JPEG, PNG, WebP, or GIF).'
        )
        return
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (
        !fileExt ||
        !AVATAR_VALIDATION.allowedExtensions.includes(fileExt as any)
      ) {
        setMessage('Error: Invalid file extension.')
        return
      }

      // Security: Additional file content validation
      try {
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Check for common image file signatures
        const isValidImage =
          (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) || // JPEG
          (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) || // PNG
          (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) || // WebP
          (uint8Array[0] === 0x47 && uint8Array[1] === 0x49) // GIF

        if (!isValidImage) {
          setMessage('Error: File does not appear to be a valid image.')
          return
        }
      } catch (error) {
        setMessage('Error: Unable to validate file.')
        return
      }

      setIsUploading(true)
      setMessage('')

      try {
        // Security: Use secure file naming
        const timestamp = Date.now()
        const fileName = `${user.id}_avatar_${timestamp}.${fileExt}`
        const filePath = fileName

        // Upload with security headers
        const { error: uploadError, data: uploadData } =
          await supabaseClient.storage.from('avatars').upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
          .from('avatars')
          .getPublicUrl(filePath)

        if (!urlData.publicUrl) {
          throw new Error('Failed to get public URL')
        }

        // Update form data
        setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))

        // Update profile in database with proper error handling
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .upsert(
            {
              id: user.id,
              avatar_url: urlData.publicUrl,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'id',
            }
          )

        if (updateError) {
          console.error('Error updating profile with avatar:', updateError)
          setMessage(`Database update failed: ${updateError.message}`)
        } else {
          // Refresh profile from database to ensure consistency
          await refreshProfile()
          setMessage('✅ Avatar uploaded and saved successfully!')
        }
      } catch (error: any) {
        console.error('Error uploading avatar:', error)
        setMessage(
          `Error uploading avatar: ${error.message || 'Please try again.'}`
        )
      } finally {
        setIsUploading(false)
      }
    },
    [user, refreshProfile]
  )

  // Security: Enhanced form submission with validation
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return

      setIsSaving(true)
      setMessage('')
      setValidationErrors([])

      try {
        // Validate form before submission
        const errors = validateForm(formData)
        if (errors.length > 0) {
          setValidationErrors(errors)
          setMessage('Please fix the validation errors below.')
          setIsSaving(false)
          return
        }

        // Security: Sanitize all inputs before database update
        const phoneValue = unformatPhoneNumber(formData.phone)
        const updateData: any = {
          first_name: sanitizeInput(formData.first_name) || null,
          last_name: sanitizeInput(formData.last_name) || null,
          phone: phoneValue || null,
          company: sanitizeInput(formData.company) || null,
          updated_at: new Date().toISOString(),
        }

        // Only include avatar_url if it exists
        if (formData.avatar_url) {
          updateData.avatar_url = formData.avatar_url
        }

        console.log('Saving profile data:', updateData)

        const { error } = await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)

        if (error) {
          console.error('Database error:', error)
          throw error
        }

        console.log('Profile saved successfully')
        setMessage('✅ Profile updated successfully!')
      } catch (error: any) {
        console.error('Error updating profile:', error)
        setMessage(
          `Error updating profile: ${error.message || 'Please try again.'}`
        )
      } finally {
        setIsSaving(false)
      }
    },
    [user, formData, validateForm, sanitizeInput]
  )

  // Performance: Early returns for loading states
  if (isLoading) {
    return (
      <div className="dark">
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#FAD92D]"></div>
            <p className="mt-4">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to home
  }

  return (
    <DashboardLayout userName={firstName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-2 text-white">
            Manage your profile information and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6 shadow-md">
              <h2 className="mb-6 text-xl font-semibold text-foreground">
                Profile Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.avatar_url} alt="Profile" />
                      <AvatarFallback className="text-lg">
                        {formData.first_name?.charAt(0) ||
                          user.email?.charAt(0) ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#FAD92D] text-black hover:bg-opacity-90"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept={AVATAR_VALIDATION.allowedTypes.join(',')}
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      Profile Photo
                    </h3>
                    <p className="text-sm text-white">
                      {isUploading
                        ? 'Uploading...'
                        : 'Click the camera icon to upload a new photo (max 5MB)'}
                    </p>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      <User className="mr-2 inline h-4 w-4" />
                      First Name
                    </label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="w-full"
                      maxLength={VALIDATION_RULES.firstName.maxLength}
                    />
                    {validationErrors.find((e) => e.field === 'first_name') && (
                      <p className="mt-1 text-xs text-red-400">
                        {
                          validationErrors.find((e) => e.field === 'first_name')
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="last_name"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Last Name
                    </label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="w-full"
                      maxLength={VALIDATION_RULES.lastName.maxLength}
                    />
                    {validationErrors.find((e) => e.field === 'last_name') && (
                      <p className="mt-1 text-xs text-red-400">
                        {
                          validationErrors.find((e) => e.field === 'last_name')
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    <Mail className="mr-2 inline h-4 w-4" />
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full"
                    disabled
                  />
                  <p className="mt-1 text-xs text-white">
                    Email cannot be changed from this page
                  </p>
                </div>

                {/* Phone Field */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    <Phone className="mr-2 inline h-4 w-4" />
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className="w-full"
                    maxLength={14} // (xxx) xxx-xxxx format
                  />
                  {validationErrors.find((e) => e.field === 'phone') && (
                    <p className="mt-1 text-xs text-red-400">
                      {
                        validationErrors.find((e) => e.field === 'phone')
                          ?.message
                      }
                    </p>
                  )}
                </div>

                {/* Company Field */}
                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    <Building className="mr-2 inline h-4 w-4" />
                    Company
                  </label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Enter your company name"
                    className="w-full"
                    maxLength={VALIDATION_RULES.company.maxLength}
                  />
                  {validationErrors.find((e) => e.field === 'company') && (
                    <p className="mt-1 text-xs text-red-400">
                      {
                        validationErrors.find((e) => e.field === 'company')
                          ?.message
                      }
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                  <div>
                    {message && (
                      <p
                        className={`text-sm ${
                          message.includes('Error') ||
                          message.includes('failed')
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="bg-[#FAD92D] text-black hover:bg-opacity-90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Account Information Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Account Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">User ID</p>
                  <p className="font-mono text-sm text-foreground">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Account Created
                  </p>
                  <p className="text-sm text-foreground">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Last Updated</p>
                  <p className="text-sm text-foreground">
                    {profile?.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-white hover:text-black"
                  onClick={() => router.push('/dashboard/billing')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-white hover:text-black"
                  onClick={() => router.push('/dashboard/help')}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

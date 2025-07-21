<template>
  <h1>Chats</h1>
  <button @click="launchWhatsAppSignup">Connect WhatsApp</button>
</template>

<script setup>
import { onMounted } from 'vue'
import { API } from '~/services'

const loadFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('facebook-jssdk')) {
      resolve()
      return
    }
    const js = document.createElement('script')
    js.id = 'facebook-jssdk'
    js.src = 'https://connect.facebook.net/en_US/sdk.js'
    js.onload = resolve
    js.onerror = () => reject(new Error('Failed to load Facebook SDK'))
    document.body.appendChild(js)
  })
}

const fetchAppId = async () => {
  try {
    const response = await API.meta.getAppId()
    return response.data.app_id
  } catch (error) {
    console.error(error)
  }
}

const initializeFacebookSDK = async () => {
  const appId = await fetchAppId()

  window.fbAsyncInit = function () {
    FB.init({
      appId: appId, // Replace with your App ID
      autoLogAppEvents: true,
      xfbml: true,
      version: 'v22.0', // Ensure the version is valid
    })
    console.log('Facebook SDK initialized')
  }
}

const launchWhatsAppSignup = () => {
  FB.login(
    (response) => {
      if (response.authResponse) {
        console.log('Login successful:', response)
        const token = response.authResponse.accessToken
        try {
          API.tenant.storeLongLovedToken(token)
        } catch (error) {
          console.error(error)
        }
      } else {
        console.error('Login failed:', response)
      }
    },
    {
      scope: 'business_management,whatsapp_business_management',
    },
  )
}

onMounted(async () => {
  try {
    await initializeFacebookSDK()
    await loadFacebookSDK()
    console.log('Facebook SDK loaded and initialized')
  } catch (error) {
    console.error('Error initializing Facebook SDK:', error)
  }
})
</script>

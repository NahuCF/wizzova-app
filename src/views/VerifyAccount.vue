<template></template>

<script setup>
import { onMounted } from 'vue'
import AuthService from '~/services/AuthService'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const verify = async () => {
  const token = route.query.token
  await AuthService.verifyAccount(token)
  router.push({ name: 'login' })
}
onMounted(() => {
  verify()
})
</script>

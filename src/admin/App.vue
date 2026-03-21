<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminStore } from './stores/admin'
import LoginForm from './components/LoginForm.vue'
import AdminTabs from './components/AdminTabs.vue'
import RecipeForm from './components/RecipeForm.vue'
import RecipeList from './components/RecipeList.vue'
import BlogForm from './components/BlogForm.vue'
import BlogList from './components/BlogList.vue'
import DeleteModal from './components/DeleteModal.vue'

const store = useAdminStore()

onMounted(() => {
  store.initAuth()
})
</script>

<template>
  <div v-if="!store.isAuthenticated">
    <LoginForm />
  </div>
  <div v-else class="page-enter">
    <section class="section admin-section">
      <div class="container">
        <div class="admin-header">
          <h1>Admin — fit.foodbyshyla</h1>
        </div>

        <AdminTabs />

        <div class="admin-tab-content" :class="{ 'admin-tab-content--active': store.activeTab === 'recipes' }" id="tab-recipes">
          <RecipeForm />
          <div class="admin-items-list" id="recipes-list">
            <h3>Bestaande recepten</h3>
            <RecipeList />
          </div>
        </div>

        <div v-show="store.activeTab === 'blog'" class="admin-tab-content admin-tab-content--active" id="tab-blog">
          <BlogForm />
          <div class="admin-items-list" id="blog-list">
            <h3>Bestaande blogposts</h3>
            <BlogList />
          </div>
        </div>
      </div>
    </section>
  </div>

  <DeleteModal />
</template>

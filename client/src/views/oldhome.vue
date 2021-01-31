<template>
  <!-- This example requires Tailwind CSS v2.0+ -->
  <div class="h-screen flex overflow-hidden bg-blue-50">
    <!-- Off-canvas menu for mobile, show/hide based on off-canvas menu state. -->
    <!-- Static sidebar for desktop -->
    <div class="hidden bg-blue-900 md:flex md:flex-shrink-0">
      <div class="flex flex-col w-64">
        <!-- Sidebar component, swap this element with another sidebar if you like -->
        <div class="flex flex-col h-0 flex-1">
          <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div class="flex items-center flex-shrink-0 px-4">
              <p class="text-white font-bold text-2xl">Harbormaster</p>
            </div>
            <nav class="mt-5 flex-1 px-2 space-y-1">
              <!--
              // Highlighted repo. Use later
              <a
                href="#"
                class="bg-indigo-800 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                Dashboard
              </a>
              -->
              <a
                v-for="repo in repositories"
                :key="repo"
                :href="`#${repo}`"
                class="text-white hover:bg-indigo-600 hover:bg-opacity-75 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                {{ repo }}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <main
        class="flex-1 relative z-0 overflow-y-auto focus:outline-none"
        tabindex="0"
      >
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 class="text-xl font-semibold text-gray-400">
              Repository
              <span class="text-2xl font-bold text-gray-800 uppercase">{{
                selectedRepo
              }}</span>
            </h1>
          </div>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <!-- Replace with your content -->
            <div class="py-4 divide-y border-gray-100">
              <div class="">
                https://docs.docker.com/engine/api/v1.41/#operation/ContainerCreate
                <textarea
                  v-model="repoConfig"
                  rows="10"
                  class="p-2 max-w-xl shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Env:
- VAR=value

HostConfig:
  PortBindings:
   5000/tcp:
     - HostPort: '8080'
"
                ></textarea>

                <button
                  type="button"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  @click="setConfig"
                >
                  Update
                </button>
              </div>
              <div v-for="tag in tags" :key="tag" class="p-4">
                <p>{{ tag }}</p>
                <button
                  @click="deploy(tag)"
                  v-if="!repoStatus || repoStatus.tag != tag"
                  type="button"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Deploy
                </button>
                <p v-if="repoStatus && repoStatus.tag == tag">
                  Deployed on: {{ repoStatus.date }}
                </p>
              </div>
            </div>
            <!-- /End replace -->
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Home",
  data() {
    return {
      repositories: [],
      selectedRepo: null,
      repoStatus: null,
      repoConfig: null,
      repoConfigDate: null,
      tags: [],
    };
  },
  watch: {
    selectedRepo() {
      this.fetchTags();
      this.fetchRepoStatus();
      this.fetchConfig();
    },
  },
  mounted() {
    this.fetchRepositories();
  },
  methods: {
    async fetchRepositories() {
      const response = await axios.get("/api/repository/list");
      this.repositories = response.data.repositories;
      this.selectedRepo = response.data.repositories[0];
    },
    async fetchTags() {
      const response = await axios.get("/api/repository/tags", {
        params: { repository: this.selectedRepo },
      });
      this.tags = response.data.tags.sort();
    },
    async deploy(tag) {
      const response = await axios.post("/api/repository/deploy", {
        repository: this.selectedRepo,
        name: this.selectedRepo,
        tag,
      });
      console.log("deploy status:", response.data);
      this.fetchRepoStatus();
    },
    async fetchRepoStatus() {
      const response = await axios.get("/api/repository/status", {
        params: { repository: this.selectedRepo },
      });
      this.repoStatus = response.data;
    },
    async fetchConfig() {
      const response = await axios.get("/api/repository/config", {
        params: { repository: this.selectedRepo },
      });
      console.log(response.data);
      this.repoConfig = response.data.yaml;
    },
    async setConfig() {
      await axios.post("/api/repository/config", {
        repository: this.selectedRepo,
        config: this.repoConfig,
      });
    },
  },
};
</script>

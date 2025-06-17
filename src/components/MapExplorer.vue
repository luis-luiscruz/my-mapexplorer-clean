<template>  <div class="h-screen flex flex-col">
      <!-- Top Bar -->
    <div class="navbar bg-base-100 shadow-lg border-b border-base-300 z-[9999]">
      <div class="navbar-start"><a class="btn btn-ghost text-xl ml-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          GeoExplorador
        </a>
          <!-- Database Status Indicator in Navbar -->
        <div class="tooltip tooltip-bottom" :data-tip="dbStatusTooltip">
          <div 
            @click="testDbConnection"
            class="flex items-center ml-3 px-2 py-1 bg-base-200/50 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
          >
            <div 
              class="w-2 h-2 rounded-full mr-2 transition-all duration-300"
              :class="[
                dbStatusIndicator.color,
                dbStatusIndicator.animate ? 'animate-pulse' : ''
              ]"
            ></div>
            <span class="text-xs text-base-content/70">{{ dbStatusIndicator.text }}</span>
            <div v-if="isCheckingDb" class="loading loading-spinner loading-xs ml-2"></div>
          </div>
        </div>
        
        <!-- Left Panel Control - after GeoExplorador -->
        <button @click="toggleLeftPanel" 
                :class="['btn btn-ghost btn-sm ml-2', leftPanelOpen ? 'btn-active text-primary' : 'text-base-content/50']"
                class="tooltip tooltip-bottom" 
                data-tip="Mostrar/Ocultar Painel de Controlos">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>
      </div>      
      <div class="navbar-center">
        <!-- Search bar removed -->
      </div>      <div class="navbar-end">
        <!-- User Menu -->
        <UserMenu />
      </div>
    </div>
      <!-- Main Content Area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Panel -->
      <div v-show="leftPanelOpen" 
           class="w-64 bg-base-100 border-r border-base-300 flex flex-col shadow-lg transition-all duration-300 ease-in-out">
        <!-- Panel Header -->        <div class="p-2 flex items-center justify-between">
          <div class="flex flex-col">
            <h3 class="text-base font-semibold flex items-center">
              <!-- Dynamic icon and title based on content -->
              <svg v-if="leftPanelContent === 'locations'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {{ leftPanelContent === 'locations' ? 'Locais' : 'Postos de Carregamento' }}
            </h3>
              <!-- Charger Statistics -->
            <div v-if="leftPanelContent === 'chargers' && chargerStats.total > 0" class="flex items-center gap-2 mt-1">
              <span class="badge badge-neutral badge-xs">{{ chargerStats.total }} total</span>
              <span v-if="chargerStats.available > 0" class="badge badge-success badge-xs">{{ chargerStats.available }} disponíveis</span>
              <span v-if="chargerStats.unavailable > 0" class="badge badge-error badge-xs">{{ chargerStats.unavailable }} ocupados</span>
            </div>
          </div>
          <button @click="toggleLeftPanel" class="btn btn-ghost btn-xs btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Panel Mode Toggle -->
        <div class="px-2 pb-2">
          <div class="form-control">
            <div class="label cursor-pointer justify-start gap-3 p-1" @click="toggleShowLocations">
              <input 
                type="checkbox" 
                class="toggle toggle-primary toggle-sm pointer-events-none" 
                :checked="showLocations"
                readonly
              />
              <div>
                <div class="label-text font-medium text-sm">Carrega Locais</div>
                <div class="label-text-alt text-xs text-base-content/60">
                  {{ showLocations ? 'Mostrando informações de locais' : 'Mostrando postos de carregamento' }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Panel Content - Dynamic based on showLocations -->
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <!-- CHARGERS Content (when showLocations is FALSE - default mode) -->
          <template v-if="!showLocations">
            <!-- Charger Controls -->
            <div class="card bg-base-300 shadow-sm">
              <div class="card-body p-2">
                <div class="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" class="peer" checked />
                  <div class="collapse-title text-sm font-semibold min-h-0 py-2 px-0">
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Filtros e Controlos
                      </div>
                    </div>
                  </div>
                  <div class="collapse-content px-0 pb-0">
                    <div class="pt-1 space-y-3">
                      <div class="form-control">
                        <label class="label py-1">
                          <span class="label-text text-xs">Filtro LIDL</span>
                        </label>
                        <div class="flex items-center space-x-2">
                          <input 
                            v-model="lidlFilterEnabled" 
                            @change="filterChargers"
                            type="checkbox" 
                            class="toggle toggle-accent toggle-sm" 
                          />
                          <span class="text-xs text-base-content/70">
                            {{ lidlFilterEnabled ? 'Apenas LIDL' : 'Todos os postos' }}
                          </span>
                        </div>
                      </div>
                      
                      <div class="form-control">
                        <label class="label py-1">
                          <span class="label-text text-xs">Clustering</span>
                        </label>
                        <div class="flex items-center space-x-2">
                          <input 
                            v-model="clusteringEnabled" 
                            @change="toggleClustering"
                            type="checkbox" 
                            class="toggle toggle-primary toggle-sm" 
                          />
                          <span class="text-xs text-base-content/70">
                            {{ clusteringEnabled ? 'Activado' : 'Desactivado' }}
                          </span>
                        </div>
                      </div>
                      
                      <div class="form-control">
                        <label class="label py-1">
                          <span class="label-text text-xs">Procurar posto</span>
                        </label>
                        <input v-model="chargerSearch" 
                               @input="filterChargers"
                               type="text" 
                               placeholder="Nome, localização, operador..." 
                               class="input input-bordered input-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Charger List -->
            <div class="card bg-base-300 shadow-sm">
              <div class="card-body p-2">
                <!-- Header sem accordion -->
                <div class="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span class="text-sm font-semibold">Postos Disponíveis</span>
                  <span v-if="filteredChargers.length !== chargers.length" class="badge badge-primary badge-xs ml-2">
                    {{ filteredChargers.length }} de {{ chargers.length }}
                  </span>
                </div>

                <!-- Lista sempre visível -->
                <div v-if="filteredChargers.length > 0" class="max-h-80 overflow-y-auto border border-base-200 rounded-lg bg-base-100/50">                  <div class="space-y-1 p-2">
                    <div v-for="(charger, index) in filteredChargers" 
                         :key="`${charger.Posto_ID || 'unknown'}-${charger.Latitude}-${charger.Longitude}-${index}`"
                         @click="flyToCharger(charger)"
                         class="flex items-center space-x-2 p-2 hover:bg-base-200 rounded cursor-pointer transition-all bg-base-100 border border-base-200 hover:border-primary shadow-sm hover:shadow-md">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-md">
                          ⚡
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-semibold truncate mb-1 text-base-content">{{ getChargerName(charger) }}</div>
                        <div class="text-xs text-base-content/80 mb-1 font-medium">{{ getChargerLocation(charger) }}</div>                        <div class="flex items-center justify-between text-xs">
                          <span v-if="charger.distance_km" class="text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded-full">
                            📍 {{ formatDistance(charger.distance_km) }} km
                          </span>
                          <span class="text-base-content/60 font-medium">Posto ID: {{ charger.Posto_ID }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Loading State -->
                <div v-else-if="chargersLoading" class="flex flex-col items-center justify-center py-6 bg-base-200 rounded-lg border border-base-200">
                  <span class="loading loading-spinner loading-md text-primary"></span>
                  <span class="mt-2 text-sm text-base-content/70">Carregando postos...</span>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-6 bg-base-200 rounded-lg border border-base-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p class="text-sm text-base-content/70 mb-1">Nenhum posto encontrado</p>
                  <p class="text-xs text-base-content/50">Ajuste o raio de busca ou mova o mapa</p>
                </div>
              </div>
            </div>
          </template>

          <!-- LOCATIONS Content (when showLocations is TRUE) -->
          <template v-else>
            <!-- Location and Controls Accordion -->
            <div class="card bg-base-300 shadow-sm">
              <div class="card-body p-2">
                <div class="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" class="peer" />
                  <div class="collapse-title text-sm font-semibold min-h-0 py-2 px-0 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Localização & Controlos
                  </div>
                  <div class="collapse-content px-0 pb-0">
                    <div class="pt-1">
                      <!-- Location and Controls - Side by Side -->
                      <div class="grid grid-cols-5 gap-2 mb-2">
                        <!-- User Location -->
                        <div class="col-span-3 card bg-base-300 shadow-sm">
                          <div class="card-body p-2">
                            <button @click="getCurrentLocation(true)" class="btn btn-primary btn-xs w-full h-7">
                              Localizar-me
                            </button>
                            <div v-if="userLocation" class="text-sm text-base-content/70 mt-1 leading-tight">
                              <p>{{ userLocation.lat?.toFixed ? userLocation.lat.toFixed(4) : userLocation.lat }}, {{ userLocation.lng?.toFixed ? userLocation.lng.toFixed(4) : userLocation.lng }}</p>
                            </div>
                          </div>
                        </div>
                        <!-- Map Controls -->
                        <div class="col-span-2 card bg-base-300 shadow-sm">
                          <div class="card-body p-2">
                            <div class="flex gap-1 mb-2">
                              <button @click="zoomIn" class="btn btn-outline btn-xs flex-1 h-7">+</button>
                              <button @click="zoomOut" class="btn btn-outline btn-xs flex-1 h-7">-</button>
                            </div>
                            <div class="form-control">
                              <div class="flex justify-between items-center mb-1">
                                <span class="text-sm text-base-content/70">Zoom</span>
                                <span class="text-sm font-mono">{{ currentZoom }}</span>
                              </div>
                              <input v-model="currentZoom" @change="setZoom" type="range" min="1" max="18" class="range range-primary range-xs" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Highway Exits Information -->
            <HighwayExitsInfo 
              :show-nearby-exits="true"
              @highway-detected="(highway) => console.log('Highway detected:', highway)"
              @exit-detected="(exit) => console.log('Next exit:', exit)"
              @location-changed="(coords) => console.log('Location updated:', coords)"
            />
            
            <!-- Weather Accordion -->
            <div class="card bg-base-300 shadow-sm">
              <div class="card-body p-2">
                <div class="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" class="peer" checked />
                  <div class="collapse-title text-sm font-semibold min-h-0 py-2 px-0">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      Meteorologia
                      <span v-if="currentLocationName" class="text-xs opacity-70 ml-1">({{ currentLocationName }})</span>
                    </div>
                  </div>
                  <div class="collapse-content px-0 pb-0">
                    <div class="pt-1 pb-2">
                      <button @click="updateWeather" class="btn btn-ghost btn-xs" :disabled="isLoadingWeather">
                        <svg v-if="!isLoadingWeather" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span v-else class="loading loading-spinner loading-xs"></span>
                        Actualizar
                      </button>
                    </div>
                    <div>
                      <div v-if="weatherData" class="space-y-2 p-2 bg-base-300 rounded">
                        <div class="flex items-center justify-between">
                          <span class="text-xl">{{ getWeatherIcon(weatherData.description) }}</span>
                          <div class="text-right">
                            <div class="text-lg font-semibold">{{ Math.round(weatherData.temperature) }}°C</div>
                            <div class="text-xs text-base-content/70 capitalize">{{ weatherData.description }}</div>
                          </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div class="text-base-content/70">Humidade</div>
                            <div class="font-semibold">{{ weatherData.humidity }}%</div>
                          </div>
                          <div>
                            <div class="text-base-content/70">Vento</div>
                            <div class="font-semibold">{{ Math.round(weatherData.windSpeed) }} km/h</div>
                          </div>
                        </div>
                        <div class="text-xs text-base-content/50 text-center">
                          Actualizado: {{ formatTime(weatherData.lastUpdate) }}
                        </div>
                      </div>
                      <div v-else class="flex items-center justify-center py-3 text-sm text-base-content/70 bg-base-300 rounded">
                        Clique em actualizar para carregar meteorologia
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Places Accordion -->
            <div class="card bg-base-300 shadow-sm">
              <div class="card-body p-2">
                <div class="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" class="peer" />
                  <div class="collapse-title text-sm font-semibold min-h-0 py-2 px-0">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Locais Rápidos
                      <span class="badge badge-primary badge-xs ml-2">{{ quickPlaces.length }}</span>
                    </div>
                  </div>
                  <div class="collapse-content px-0 pb-0">
                    <div class="space-y-1 pt-1">
                      <button v-for="place in quickPlaces" 
                              :key="place.name"
                              @click="flyToPlace(place)"
                              class="btn btn-ghost btn-xs w-full justify-start text-left h-6 text-sm hover:bg-base-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {{ place.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nearby Places Accordion -->
            <div class="card bg-base-300 shadow-sm">
              <div class="card-body p-2">
                <div class="collapse collapse-arrow bg-base-300">
                  <input type="checkbox" class="peer" />
                  <div class="collapse-title text-sm font-semibold min-h-0 py-2 px-0">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Locais Próximos
                      <span class="badge badge-accent badge-xs ml-2">{{ nearbyPOIs.length }}</span>
                    </div>
                  </div>
                  <div class="collapse-content px-0 pb-0">
                    <div class="pt-1 pb-2">
                      <button @click="updateNearbyPlaces" class="btn btn-ghost btn-xs" :disabled="isLoadingPlaces">
                        <svg v-if="!isLoadingPlaces" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span v-else class="loading loading-spinner loading-xs"></span>
                        Actualizar
                      </button>
                    </div>
                    <div v-if="nearbyPOIs.length > 0" class="space-y-1">
                      <div v-for="poi in nearbyPOIs.slice(0, 10)" 
                           :key="`${poi.name}-${poi.category}`"
                           @click="flyToPlace(poi)"
                           class="cursor-pointer p-2 hover:bg-base-200 rounded text-xs transition-colors border border-base-300 hover:border-primary">
                        <div class="font-medium text-base-content">{{ poi.name }}</div>
                        <div class="text-base-content/60">{{ poi.category }}</div>
                        <div v-if="poi.distance" class="text-accent font-medium">{{ formatDistance(poi.distance) }}km</div>
                      </div>
                    </div>
                    <div v-else-if="isLoadingPlaces" class="flex items-center justify-center py-3">
                      <span class="loading loading-spinner loading-sm"></span>
                    </div>
                    <div v-else class="text-xs text-base-content/70 text-center py-2">
                      Clique em actualizar para carregar locais próximos
                    </div>
                  </div>
                </div>
              </div>
            </div>          </template>
        </div>
      </div>      <!-- Map Container -->
      <div class="flex-1 relative">
        <div ref="mapContainer" class="absolute inset-0" :style="{ 
          top: mapOffset + 'px', 
          height: `calc(100% - ${mapOffset}px)` 
        }"></div>
        <!-- Map Loading -->
        <div v-if="isLoading" class="absolute inset-0 bg-base-200/50 flex items-center justify-center z-10">
          <div class="loading loading-spinner loading-lg text-primary"></div>
        </div>        <!-- Custom Charger Popup Component -->
        <ChargerInfoPopup
          v-if="map"
          v-model="chargerPopupVisible"
          :charger="selectedCharger"
          :map="map"
        />
      </div>
    </div>
  </div>
</template>
<style scoped>
.custom-user-location-icon {
  z-index: 1000;
}

.custom-charger-icon {
  z-index: 800;
}

/* Cluster styling */
:deep(.marker-cluster-small) {
  background-color: rgba(16, 185, 129, 0.6);
}

:deep(.marker-cluster-small div) {
  background-color: rgba(16, 185, 129, 0.8);
}

:deep(.marker-cluster-medium) {
  background-color: rgba(251, 191, 36, 0.6);
}

:deep(.marker-cluster-medium div) {
  background-color: rgba(251, 191, 36, 0.8);
}

:deep(.marker-cluster-large) {
  background-color: rgba(239, 68, 68, 0.6);
}

:deep(.marker-cluster-large div) {
  background-color: rgba(239, 68, 68, 0.8);
}

:deep(.marker-cluster) {
  background-clip: padding-box;
  border-radius: 20px;
}

:deep(.marker-cluster div) {
  width: 30px;
  height: 30px;
  margin-left: 5px;
  margin-top: 5px;
  text-align: center;
  border-radius: 15px;
  font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-weight: bold;
}

:deep(.marker-cluster span) {
  line-height: 30px;
  color: white;
}
</style>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import HighwayExitsInfo from './HighwayExitsInfo.vue';
import UserMenu from './UserMenu.vue';
import ChargerInfoPopup from './ChargerInfoPopup.vue';
import { api } from '../services/api-readonly';
import { useConnectionStatus } from '../composables/useConnectionStatus';

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default defineComponent({
  name: 'MapExplorer',  components: {
    HighwayExitsInfo,
    UserMenu,
    ChargerInfoPopup
  },
  props: {
    showLocations: {
      type: Boolean,
      default: false
    }
  },
  emits: ['showLocationsChanged'],  setup(props, { emit }) {const mapContainer = ref<HTMLElement>();
    let map: L.Map | null = null;
    const mapInstance = ref<L.Map | null>(null); // Reactive reference to map
    let userLocationMarker: L.Marker | null = null;
    let wheelEventHandler: ((e: WheelEvent) => void) | null = null;
    let chargerClusterGroup: L.MarkerClusterGroup | null = null;

    // Database connection status
    const {
      statusIndicator: dbStatusIndicator,
      statusTooltip: dbStatusTooltip,
      isChecking: isCheckingDb,
      testConnection: testDbConnection,
      startPeriodicCheck
    } = useConnectionStatus();    // Reactive data
    const isLoading = ref(true);    const isLoadingWeather = ref(false);
    const isLoadingPlaces = ref(false);
    const searchQuery = ref('');
    const currentZoom = ref(14);
    const userLocation = ref<{lat: number, lng: number} | null>(null);
    const mapCenter = ref<{lat: number, lng: number} | null>(null);
    const currentLocationName = ref<string>('');    // Custom popup state
    const chargerPopupVisible = ref(false);
    const selectedCharger = ref<any>(null);
    const mapOffset = ref(0); // Dynamic map offset
    
    // Weather data
    const weatherData = ref<{
      temperature: number;
      description: string;
      humidity: number;
      windSpeed: number;
      lastUpdate: Date;
      locationName?: string;
    } | null>(null);    // Panel states - only left panel now
    const leftPanelOpen = ref(true);    // Computed property to determine panel content based on showLocations
    const leftPanelContent = computed(() => {
      const content = props.showLocations ? 'locations' : 'chargers';
      console.log('🔄 TOGGLE: MapExplorer leftPanelContent computed, showLocations:', props.showLocations, 'content:', content);
      return content;
    });// Handle showLocations changes from UserMenu
    const handleShowLocationsChanged = (value: boolean) => {
      console.log('🔄 TOGGLE: MapExplorer handleShowLocationsChanged called with value:', value);
      // Emit the change, panel content will update based on showLocations prop
      emit('showLocationsChanged', value);
    };
    
    // Toggle showLocations directly in MapExplorer
    const toggleShowLocations = async (event: Event) => {
      // Prevent default behavior
      event.preventDefault()
      event.stopPropagation()
      
      // Toggle the value
      const newValue = !props.showLocations
      
      console.log('🔄 TOGGLE: MapExplorer toggleShowLocations called, new value:', newValue);
      
      // Emit the change to parent (App.vue)
      emit('showLocationsChanged', newValue);
      console.log('🔄 TOGGLE: Event emitted with value:', newValue);
    };    // Sample data
    const quickPlaces = ref([
      { name: 'Lisboa', lat: 38.7223, lng: -9.1393 },
      { name: 'Porto', lat: 41.1579, lng: -8.6291 },
      { name: 'Coimbra', lat: 40.2033, lng: -8.4103 },
      { name: 'Braga', lat: 41.5518, lng: -8.4229 },
      { name: 'Setúbal', lat: 38.5245, lng: -8.8882 },
      { name: 'Montijo', lat: 38.7071, lng: -8.9735 },
      { name: 'Vendas Novas', lat: 38.6768, lng: -8.4577 },
      { name: 'Palmela', lat: 38.5683, lng: -8.8998 },
    ]);
    
    // Helper function to create popup content for custom popup
    const createPopupContentHTML = (charger: any) => {
      if (!charger) return '';
      
      const chargerName = getChargerName(charger);
      const chargerLocation = getChargerLocation(charger);
      const lat = parseFloat(charger.Latitude);
      const lng = parseFloat(charger.Longitude);
      
      if (isNaN(lat) || isNaN(lng)) return '';
      
      return `
        <div class="font-semibold text-sm mb-2">🔌 ${chargerName}</div>
        ${charger.OPERADOR ? `<div class="text-xs text-base-content/70 mb-1">Operador: ${charger.OPERADOR}</div>` : ''}
        ${charger.POTENCIA_TOMADA ? `<div class="text-xs text-base-content/70 mb-1">Potência: ${charger.POTENCIA_TOMADA}kW</div>` : ''}
        ${charger.ConnectorType ? `<div class="text-xs text-base-content/70 mb-1">Conector: ${charger.ConnectorType}</div>` : ''}
        ${charger.Estado ? `<div class="text-xs text-base-content/70 mb-1">Estado: ${charger.Estado}</div>` : ''}
        ${chargerLocation !== `${lat.toFixed(4)}, ${lng.toFixed(4)}` ? `<div class="text-xs text-base-content/70 mb-1">${chargerLocation}</div>` : ''}
        ${charger.distance_km ? `<div class="text-xs text-base-content/70 mb-2">Distância: ${typeof charger.distance_km === 'number' ? charger.distance_km.toFixed(1) : parseFloat(charger.distance_km) || charger.distance_km}km</div>` : ''}
        <a href="https://maps.google.com/maps?q=${lat},${lng}" 
           target="_blank" 
           class="link link-primary text-xs font-medium inline-block mt-2">
          🧭 Navegar no Google Maps
        </a>
      `;
    };const nearbyPOIs = ref<Array<{
      id: number; 
      name: string; 
      icon: string; 
      distance: string;
      lat?: number;
      lng?: number;    }>>([]);

    // Electric Charger data
    const chargers = ref<Array<any>>([]);
    
    const chargersLoading = ref(false);
    const chargerMarkers = ref<L.Marker[]>([]);
    
    // Charger search and filter
    const chargerSearch = ref('');
    const filteredChargers = ref<Array<any>>([]);    const clusteringEnabled = ref(true); // Enable clustering by default
    const lidlFilterEnabled = ref(false); // LIDL filter toggle    // Computed properties for charger statistics
    const chargerStats = computed(() => {
      const total = filteredChargers.value.length;
      const available = filteredChargers.value.filter(charger => 
        charger.Estado && (
          charger.Estado.toLowerCase().includes('disponível') ||
          charger.Estado.toLowerCase().includes('available') ||
          charger.Estado.toLowerCase().includes('livre') ||
          charger.Estado.toLowerCase().includes('operacional')
        )
      ).length;
      const unavailable = filteredChargers.value.filter(charger => 
        charger.Estado && (
          charger.Estado.toLowerCase().includes('ocupado') ||
          charger.Estado.toLowerCase().includes('indisponível') ||
          charger.Estado.toLowerCase().includes('manutenção') ||
          charger.Estado.toLowerCase().includes('offline')
        )
      ).length;
      
      return { total, available, unavailable };
    });// Direct Portuguese database field access - no normalization needed

    // Methods
    const initMap = async () => {
      if (!mapContainer.value) return;// Default coordinates (Lisboa)
      const defaultLat = 38.7223;
      const defaultLng = -9.1393;
      const defaultZoom = 14;      // Initialize map with default view first
      map = L.map(mapContainer.value, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false, // Disable default scroll wheel zoom
        zoomSnap: 1,
        zoomDelta: 1,
        wheelPxPerZoomLevel: 120
      }).setView([defaultLat, defaultLng], defaultZoom);

      // Set reactive map instance
      mapInstance.value = map;

      // Set initial center
      mapCenter.value = { lat: defaultLat, lng: defaultLng };
      currentZoom.value = defaultZoom;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Initialize marker cluster group
      chargerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let size = 'small';
          
          if (count >= 10) size = 'large';
          else if (count >= 5) size = 'medium';
          
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(40, 40)
          });
        }
      });

      // Try to get user location and update view
      try {
        await getCurrentLocation(true);
      } catch (error) {
        console.log('A usar localização predefinida:', error);
        // Keep default view if geolocation fails
      }      // Load initial charger markers in the visible area
      loadChargersInBounds();
      
      // Map event listeners
      map.on('zoomend', () => {
        if (map) {
          currentZoom.value = map.getZoom();
          
          // Update map center after zoom to keep location tracking accurate
          const center = map.getCenter();
          mapCenter.value = { lat: center.lat, lng: center.lng };
        }
      });

      map.on('moveend', () => {
        if (map) {
          const center = map.getCenter();
          mapCenter.value = { lat: center.lat, lng: center.lng };
          
          // Load chargers in the new visible area
          loadChargersInBounds();
        }
      });      // Custom wheel event to maintain user location centered during zoom
      wheelEventHandler = (e: WheelEvent) => {
        if (!map) return;
        
        e.preventDefault();
        
        // Get mouse position relative to map container
        const rect = map.getContainer().getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert mouse position to lat/lng
        const mouseLatLng = map.containerPointToLatLng([mouseX, mouseY]);
        
        // Determine zoom direction
        const zoomDelta = e.deltaY > 0 ? -1 : 1;
        const newZoom = Math.max(1, Math.min(18, map.getZoom() + zoomDelta));
        
        // Zoom towards mouse cursor position (like normal behavior)
        map.setZoomAround(mouseLatLng, newZoom);
      };
      
      map.getContainer().addEventListener('wheel', wheelEventHandler, { passive: false });      // Map initialization complete - hide loading spinner
      isLoading.value = false;
    };

    // Simple function to add user location marker like any other marker
    const addUserLocationMarker = (lat: number, lng: number) => {
      if (!map) return;
      
      // Remove existing user location marker if it exists
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
      }
        const popupContent = `
        <div>
          <strong>🏠 A Sua Localização</strong><br>
          <a href="https://maps.google.com/maps?q=${lat},${lng}" 
             target="_blank" 
             style="color: #0066cc; text-decoration: none; font-size: 12px;">
            🧭 Navegar no Google Maps
          </a>
        </div>
      `;
        // Create simple icon for user location with house symbol
      const userLocationIcon = L.divIcon({
        html: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">🏠</div>`,
        className: 'custom-user-location-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      
      // Create user location marker exactly like other markers
      userLocationMarker = L.marker([lat, lng], {
        icon: userLocationIcon
      })
        .addTo(map)
        .bindPopup(popupContent);
        
      console.log('Marcador da localização adicionado');
    };

    const getCurrentLocation = (flyTo = false) => {
      return new Promise((resolve, reject) => {        if (!navigator.geolocation) {
          reject(new Error('Geolocalização não suportada'));
          return;
        }

        console.log('A obter localização do utilizador...');
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log(`Localização obtida: ${lat}, ${lng}`);
            
            userLocation.value = { lat, lng };

            if (map) {
              // Simply add user location marker like any other marker
              addUserLocationMarker(lat, lng);
                if (flyTo) {
                console.log('A navegar para a localização do utilizador...');
                map.flyTo([lat, lng], 14, {
                  duration: 2,
                  easeLinearity: 0.1
                });
              }
              
              // Update location info and auto-refresh data
              updateLocationInfo(lat, lng);
            }

            resolve({ lat, lng });
          },
          (error) => {
            console.error('Erro de geolocalização:', error);
            let errorMessage = 'Erro desconhecido de geolocalização';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Permissão de geolocalização negada';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Informação de localização indisponível';
                break;
              case error.TIMEOUT:
                errorMessage = 'Timeout da geolocalização';
                break;
            }
            
            console.error(errorMessage);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout
            maximumAge: 60000
          }        );
      });
    };

    const searchLocation = async () => {
      if (!searchQuery.value.trim() || !map) return;

      try {
        isLoading.value = true;
        // Use Nominatim geocoding service
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=1`
        );
        const results = await response.json();

        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);          // Clear existing search markers
          map.eachLayer((layer) => {
            if (layer instanceof L.Marker && (layer as any).options.searchMarker) {
              map?.removeLayer(layer);
            }
          });          // Fly to location
          map.flyTo([lat, lng], 14, { duration: 1.5 });
            // Add search result marker
          const popupContent = `
            <div>
              <strong>🔍 ${result.display_name}</strong><br>
              <a href="https://maps.google.com/maps?q=${lat},${lng}" 
                 target="_blank" 
                 style="color: #0066cc; text-decoration: none; font-size: 12px;">
                🧭 Navegar no Google Maps
              </a>
            </div>
          `;
          
          const marker = L.marker([lat, lng], { searchMarker: true } as any)
            .addTo(map)
            .bindPopup(popupContent)
            .openPopup();// Update center
          mapCenter.value = { lat, lng };
          
          // Update location info and auto-refresh data
          updateLocationInfo(lat, lng);
        } else {
          console.log('Nenhum resultado encontrado para:', searchQuery.value);
        }
      } catch (error) {      console.error('Pesquisa falhou:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const flyToPlace = (place: { name: string, lat: number, lng: number }) => {
      if (!map) return;
      
      // Clear existing place markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && (layer as any).options.placeMarker) {
          map?.removeLayer(layer);
        }
      });

      map.flyTo([place.lat, place.lng], 14, {
        duration: 2,
        easeLinearity: 0.1
      });
      
      // Add place marker after animation
      setTimeout(() => {
        if (map) {
          const popupContent = `
            <div>
              <strong>📍 ${place.name}</strong><br>
              <a href="https://maps.google.com/maps?q=${place.lat},${place.lng}" 
                 target="_blank" 
                 style="color: #0066cc; text-decoration: none; font-size: 12px;">
                🧭 Navegar no Google Maps
              </a>
            </div>
          `;
          
          L.marker([place.lat, place.lng], { placeMarker: true } as any)
            .addTo(map)
            .bindPopup(popupContent)
            .openPopup();        }
      }, 1000);
      
      // Update center
      mapCenter.value = { lat: place.lat, lng: place.lng };
      
      // Update location info and auto-refresh data after animation
      setTimeout(() => {
        updateLocationInfo(place.lat, place.lng);
      }, 2000); // Wait for flyTo animation to complete
    };

    const zoomIn = () => {
      if (map) map.zoomIn();
    };

    const zoomOut = () => {
      if (map) map.zoomOut();
    };

    const setZoom = () => {
      if (map) map.setZoom(currentZoom.value);
    };

    const toggleLeftPanel = () => {
      leftPanelOpen.value = !leftPanelOpen.value;
      
      // Fix map refresh issue: invalidate map size after panel animation
      if (map) {
        setTimeout(() => {
          map?.invalidateSize();
        }, 300); // Wait for CSS transition to complete
      }    };

    const toggleClustering = () => {
      if (!map || !chargerClusterGroup) return;
      
      console.log(`🎯 Toggling clustering: ${clusteringEnabled.value ? 'ON' : 'OFF'}`);
      
      if (clusteringEnabled.value) {
        // Remove all individual markers from map
        chargerMarkers.value.forEach(marker => {
          if (map && map.hasLayer(marker as any)) {
            map.removeLayer(marker as any);
          }
        });
        
        // Clear cluster group and re-add all markers to it
        chargerClusterGroup.clearLayers();
        chargerMarkers.value.forEach(marker => {
          if (chargerClusterGroup) {
            chargerClusterGroup.addLayer(marker as any);
          }
        });
        
        // Add cluster group to map
        if (map && !map.hasLayer(chargerClusterGroup)) {
          map.addLayer(chargerClusterGroup);
        }
      } else {
        // Remove cluster group from map
        if (map && map.hasLayer(chargerClusterGroup)) {
          map.removeLayer(chargerClusterGroup);
        }
        
        // Add individual markers back to map
        chargerMarkers.value.forEach(marker => {
          if (map && !map.hasLayer(marker as any)) {
            map.addLayer(marker as any);
          }
        });
      }
    };

    // Weather and Places functions
    const getWeatherIcon = (description: string): string => {
      const desc = description.toLowerCase();
      if (desc.includes('clear')) return '☀️';
      if (desc.includes('cloud')) return '⛅';
      if (desc.includes('rain')) return '🌧️';
      if (desc.includes('snow')) return '❄️';
      if (desc.includes('storm')) return '⛈️';
      if (desc.includes('mist') || desc.includes('fog')) return '🌫️';
      return '🌤️';
    };    const formatTime = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'agora mesmo';
      if (diffMins < 60) return `há ${diffMins}min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `há ${diffHours}h`;
      return date.toLocaleDateString('pt-PT');
    };

    const getLocationName = async (lat: number, lng: number): Promise<string> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.address) {
          // Prioritize city, town, village, or suburb
          const locationName = data.address.city || 
                             data.address.town || 
                             data.address.village || 
                             data.address.suburb || 
                             data.address.county ||
                             data.address.state ||                             'Localização Desconhecida';
          return locationName;
        }        return 'Localização Desconhecida';
      } catch (error) {
        console.error('Geocodificação reversa falhou:', error);
        return 'Localização Desconhecida';
      }
    };    const updateLocationInfo = async (lat: number, lng: number) => {
      try {
        console.log(`A actualizar informação da localização: ${lat}, ${lng}`);
        const locationName = await getLocationName(lat, lng);
        currentLocationName.value = locationName;
        console.log(`Nome da localização actualizado: ${locationName}`);
      } catch (error) {
        console.error('Erro ao obter nome da localização:', error);
        currentLocationName.value = 'Localização Desconhecida';
      }
      
      // Force update weather and nearby places after location change
      // Ensure both functions are called with proper error handling
      console.log('A iniciar actualização dos dados meteorológicos e locais próximos...');
        // Use Promise.allSettled to ensure all requests are attempted even if one fails
      Promise.allSettled([
        updateWeather().catch(err => {
          console.error('Erro ao actualizar meteorologia:', err);
          return null;
        }),        updateNearbyPlaces().catch(err => {
          console.error('Erro ao actualizar locais próximos:', err);
          return null;
        }),
        loadChargersInBounds().catch(err => {
          console.error('Erro ao carregar carregadores:', err);
          return null;
        })
      ]).then(results => {
        const weatherResult = results[0];
        const placesResult = results[1];
        const chargersResult = results[2];
        
        if (weatherResult.status === 'fulfilled') {
          console.log('Meteorologia actualizada com sucesso');
        } else {
          console.warn('Falha na actualização da meteorologia:', weatherResult.reason);
        }
        
        if (placesResult.status === 'fulfilled') {
          console.log('Locais próximos actualizados com sucesso');
        } else {
          console.warn('Falha na actualização dos locais próximos:', placesResult.reason);
        }
        
        if (chargersResult.status === 'fulfilled') {
          console.log('Carregadores eléctricos carregados com sucesso');
        } else {
          console.warn('Falha no carregamento dos carregadores:', chargersResult.reason);
        }
        
        console.log('Actualização de dados completa');
      });
    };

    const updateWeather = async () => {
      if (!mapCenter.value || isLoadingWeather.value) return;
      
      isLoadingWeather.value = true;
      try {
        // Using Open-Meteo API (free, no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${mapCenter.value.lat}&longitude=${mapCenter.value.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`
        );
        const data = await response.json();
        
        if (data.current) {
          // Weather code mapping (simplified)
          const getWeatherDescription = (code: number): string => {
            if (code === 0) return 'céu limpo';
            if (code <= 3) return 'parcialmente nublado';
            if (code <= 48) return 'nevoeiro';
            if (code <= 57) return 'chuvisco';
            if (code <= 67) return 'chuva';
            if (code <= 77) return 'neve';
            if (code <= 82) return 'aguaceiros';
            if (code <= 86) return 'aguaceiros de neve';
            if (code <= 99) return 'trovoada';
            return 'desconhecido';
          };

          weatherData.value = {
            temperature: data.current.temperature_2m,
            description: getWeatherDescription(data.current.weather_code),
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            lastUpdate: new Date()
          };
        }
      } catch (error) {
        console.error('Actualização meteorológica falhou:', error);
      } finally {
        isLoadingWeather.value = false;
      }
    };

    const updateNearbyPlaces = async () => {
      if (!mapCenter.value || isLoadingPlaces.value) return;
      
      isLoadingPlaces.value = true;
      try {
        // Using Overpass API to find nearby places
        const radius = 1000; // 1km radius
        const overpassQuery = `
          [out:json][timeout:25];
          (
            node["amenity"~"^(restaurant|cafe|bank|pharmacy|hospital|fuel|school)$"](around:${radius},${mapCenter.value.lat},${mapCenter.value.lng});
            node["tourism"~"^(attraction|museum|hotel)$"](around:${radius},${mapCenter.value.lat},${mapCenter.value.lng});
            node["shop"~"^(supermarket|mall|convenience)$"](around:${radius},${mapCenter.value.lat},${mapCenter.value.lng});
          );
          out body;
        `;
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`
        });
        
        const data = await response.json();
        
        if (data.elements && data.elements.length > 0) {
          const places = data.elements
            .filter((element: any) => element.tags && element.tags.name)
            .slice(0, 6) // Limit to 6 places
            .map((element: any, index: number) => {
              const distance = calculateDistance(
                mapCenter.value!.lat, 
                mapCenter.value!.lng, 
                element.lat, 
                element.lon
              );
              
              return {
                id: index + 1,
                name: element.tags.name,
                icon: getPlaceIcon(element.tags),
                distance: `${Math.round(distance)}m`,
                lat: element.lat,
                lng: element.lon
              };
            })
            .sort((a: any, b: any) => parseInt(a.distance) - parseInt(b.distance));
          
          nearbyPOIs.value = places;
        } else {
          nearbyPOIs.value = [];
        }
      } catch (error) {
        console.error('Actualização de locais próximos falhou:', error);
        nearbyPOIs.value = [];
      } finally {
        isLoadingPlaces.value = false;
      }
    };    // Electric Charger functions
    const loadChargersInBounds = async () => {
      if (!map || chargersLoading.value) return;
      
      chargersLoading.value = true;
      const bounds = map.getBounds();
      
      const mapBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
      
      console.log(`🗺️ Loading chargers in map bounds:`, mapBounds);
        try {
        const response = await api.getChargersInBounds(mapBounds);        if (response.data && Array.isArray(response.data)) {
          chargers.value = response.data;
          console.log(`✅ Loaded ${response.data.length} chargers in bounds (NO LIMITS)`);
          
          // DEBUG: Verify if Link_MIIO and Link_Gmap fields exist
          if (response.data.length > 0) {
            const chargersWithLinks = response.data.filter(charger => 
              charger.Link_MIIO || charger.Link_Gmap
            );
            
            console.log(`🔗 Chargers with links: ${chargersWithLinks.length}/${response.data.length}`);
            
            if (chargersWithLinks.length > 0) {
              const firstWithLinks = chargersWithLinks[0];
              console.log('✅ Found charger with links:', {
                Posto_ID: firstWithLinks.Posto_ID,
                Link_MIIO: firstWithLinks.Link_MIIO,
                Link_Gmap: firstWithLinks.Link_Gmap
              });
            } else {
              console.warn('❌ No chargers found with Link_MIIO or Link_Gmap fields');
              // Show first charger structure for debugging
              console.log('� First charger structure:', Object.keys(response.data[0]));
            }
          }
          
          // Apply current filters to new data
          filterChargers();
        } else {
          console.warn('No charger data received');
          chargers.value = [];
          filteredChargers.value = [];
        }
      } catch (error) {
        console.error('❌ Error loading chargers in bounds:', error);
        chargers.value = [];
      } finally {
        chargersLoading.value = false;
      }
    };    const updateChargerMarkers = () => {
      if (!map || !chargerClusterGroup) return;
      
      console.log('🔍 Updating charger markers, filtered chargers data:', filteredChargers.value.slice(0, 2)); // Debug: show first 2 filtered chargers        
      // Clear existing charger markers from both map and cluster group
      chargerMarkers.value.forEach(marker => {
        if (map && map.hasLayer(marker as any)) {
          map.removeLayer(marker as any);
        }
      });
      if (chargerClusterGroup) {
        chargerClusterGroup.clearLayers();
      }
      chargerMarkers.value = [];      // Add new charger markers - using Portuguese database fields directly
      filteredChargers.value.forEach(charger => {
        const lat = parseFloat(charger.Latitude);
        const lng = parseFloat(charger.Longitude);
        
        if (!isNaN(lat) && !isNaN(lng) && map) {
          // Create custom icon for chargers
          const chargerIcon = L.divIcon({
            html: `<div style="background: #10B981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⚡</div>`,
            className: 'custom-charger-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
            const chargerName = getChargerName(charger);
          const chargerLocation = getChargerLocation(charger);          const popupContent = `
            <div class="bg-base-100 text-base-content p-4 rounded-lg border border-base-300 shadow-lg min-w-[200px]">
              <div class="font-semibold text-sm mb-2">🔌 ${chargerName}</div>
              ${charger.OPERADOR ? `<div class="text-xs text-base-content/70 mb-1">Operador: ${charger.OPERADOR}</div>` : ''}
              ${charger.POTENCIA_TOMADA ? `<div class="text-xs text-base-content/70 mb-1">Potência: ${charger.POTENCIA_TOMADA}kW</div>` : ''}
              ${charger.ConnectorType ? `<div class="text-xs text-base-content/70 mb-1">Conector: ${charger.ConnectorType}</div>` : ''}
              ${charger.Estado ? `<div class="text-xs text-base-content/70 mb-1">Estado: ${charger.Estado}</div>` : ''}
              ${chargerLocation !== `${lat.toFixed(4)}, ${lng.toFixed(4)}` ? `<div class="text-xs text-base-content/70 mb-1">${chargerLocation}</div>` : ''}
              ${charger.distance_km ? `<div class="text-xs text-base-content/70 mb-2">Distância: ${typeof charger.distance_km === 'number' ? charger.distance_km.toFixed(1) : parseFloat(charger.distance_km) || charger.distance_km}km</div>` : ''}
              <a href="https://maps.google.com/maps?q=${lat},${lng}" 
                 target="_blank" 
                 class="link link-primary text-xs font-medium inline-block mt-2">
                🧭 Navegar no Google Maps
              </a>
            </div>
          `;          // Custom marker with click handler for our custom popup
          const marker = L.marker([lat, lng], {
            icon: chargerIcon
          });          // Add click event to show custom popup
          marker.on('click', () => {
            // Center map on charger
            if (map) {
              map.panTo([lat, lng]);
            }
              // Show custom popup with charger data
            selectedCharger.value = charger;
            mapOffset.value = 50; // Lower map by 50px when popup opens
            chargerPopupVisible.value = true;
          });
          
          chargerMarkers.value.push(marker);
          
          // Add to cluster group or directly to map based on clustering setting
          if (clusteringEnabled.value && chargerClusterGroup) {
            chargerClusterGroup.addLayer(marker as any);
          } else {
            marker.addTo(map);
          }
        }
      });
      
      // Add cluster group to map if clustering is enabled and not already added
      if (clusteringEnabled.value && map && chargerClusterGroup && !map.hasLayer(chargerClusterGroup)) {
        map.addLayer(chargerClusterGroup);
      }
      
      console.log(`📍 Added ${chargerMarkers.value.length} charger markers to ${clusteringEnabled.value ? 'cluster group' : 'map'}`);
    };

    const getPlaceIcon = (tags: any): string => {
      if (tags.amenity) {
        switch (tags.amenity) {
          case 'restaurant': return '🍽️';
          case 'cafe': return '☕';
          case 'bank': return '🏦';
          case 'pharmacy': return '💊';
          case 'hospital': return '🏥';
          case 'fuel': return '⛽';
          case 'school': return '🏫';
          default: return '📍';
        }
      }
      if (tags.tourism) {
        switch (tags.tourism) {
          case 'attraction': return '🎯';
          case 'museum': return '🏛️';
          case 'hotel': return '🏨';
          default: return '🗺️';
        }
      }
      if (tags.shop) {
        switch (tags.shop) {
          case 'supermarket': return '🛒';
          case 'mall': return '🏬';
          case 'convenience': return '🏪';
          default: return '🛍️';
        }
      }
      return '📍';
    };

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lng2-lng1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
    };

    const flyToPOI = (poi: any) => {
      if (!map || !poi.lat || !poi.lng) return;      map.flyTo([poi.lat, poi.lng], 16, {
        duration: 1.5,
        easeLinearity: 0.1
      });// Add POI marker after animation
      setTimeout(() => {
        if (map) {
          const popupContent = `
            <div>
              <strong>${poi.icon} ${poi.name}</strong><br>
              <span style="font-size: 11px; color: #666;">${poi.distance}</span><br>
              <a href="https://maps.google.com/maps?q=${poi.lat},${poi.lng}" 
                 target="_blank" 
                 style="color: #0066cc; text-decoration: none; font-size: 12px;">
                🧭 Navegar no Google Maps
              </a>
            </div>
          `;
          
          L.marker([poi.lat, poi.lng])
            .addTo(map)
            .bindPopup(popupContent)
            .openPopup();
            
          // Update location info and auto-refresh data
          updateLocationInfo(poi.lat, poi.lng);
        }
      }, 800);
    };    // Electric Charger-specific methods
    const refreshChargers = async () => {
      console.log(`🔄 Refreshing chargers in bounds`);
      await loadChargersInBounds();
      
      // Update filtered chargers
      filterChargers();    };
    
    const flyToCharger = (charger: any) => {
      if (!map) return;

      const lat = parseFloat(charger.Latitude);
      const lng = parseFloat(charger.Longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates for charger:', charger);
        return;
      }

      map.flyTo([lat, lng], 16, {
        duration: 1.5,
        easeLinearity: 0.1
      });      // Show the custom charger popup
      selectedCharger.value = charger;
      mapOffset.value = 50; // Lower map by 50px when popup opens
      setTimeout(() => {
        chargerPopupVisible.value = true;
      }, 300);
      
      // Update location info
      updateLocationInfo(lat, lng);
    };
    
    const getChargerName = (charger: any): string => {
      // Use REAL database fields only - NO FALLBACKS
      if (charger.Localizacao) return charger.Localizacao;
      if (charger.desc_loja) return charger.desc_loja;
      if (charger.OPERADOR) return charger.OPERADOR;
      if (charger.MORADA) return charger.MORADA.split(',')[0];
      return `Posto de Carregamento #${charger.Posto_ID}`;
    };
    
    // Safe distance formatter
    const formatDistance = (distance: any): string => {
      if (distance === null || distance === undefined) return '';
      if (typeof distance === 'number') return distance.toFixed(1);
      if (typeof distance === 'string') {
        const num = parseFloat(distance);
        return isNaN(num) ? distance : num.toFixed(1);
      }
      return String(distance);
    };

    const getChargerLocation = (charger: any): string => {
      // Use REAL database fields only - NO FALLBACKS
      if (charger.MORADA) return charger.MORADA;
      if (charger.Municipio) return charger.Municipio;
      
      // Use actual field names for coordinates
      const lat = parseFloat(charger.Latitude);
      const lng = parseFloat(charger.Longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      
      return 'Localização não disponível';
    };const filterChargers = () => {
      let filtered = chargers.value;

      // Apply LIDL filter if enabled
      if (lidlFilterEnabled.value) {
        filtered = filtered.filter(charger => {
          const descLoja = (charger.desc_loja || '').toLowerCase();
          return descLoja.includes('lidl');
        });
      }      // Apply search filter if search term exists
      if (chargerSearch.value.trim()) {
        const searchTerm = chargerSearch.value.toLowerCase();
        filtered = filtered.filter(charger => {
          const name = getChargerName(charger).toLowerCase();
          const location = getChargerLocation(charger).toLowerCase();
          const operator = (charger.OPERADOR || '').toLowerCase();
          
          return name.includes(searchTerm) || 
                 location.includes(searchTerm) || 
                 operator.includes(searchTerm);
        });
      }

      filteredChargers.value = filtered;
      
      // Update map markers to reflect the filtered chargers
      updateChargerMarkers();
    };// Lifecycle
    onMounted(async () => {
      // Set fixed winter theme
      document.documentElement.setAttribute('data-theme', 'winter');
      
      // Start database connection monitoring
      const periodicCheckId = startPeriodicCheck();
      
      await nextTick();
      await initMap();
    });    onUnmounted(() => {
      // Clean up wheel event listener
      if (wheelEventHandler && map) {
        map.getContainer().removeEventListener('wheel', wheelEventHandler);
        wheelEventHandler = null;
      }
      
      if (userLocationMarker) {
        userLocationMarker = null;
      }
      
      // Clean up cluster group
      if (chargerClusterGroup) {
        chargerClusterGroup.clearLayers();
        chargerClusterGroup = null;
      }
        if (map) {
        map.remove();
      }
    });

    // Watch for popup visibility changes to reset map offset
    watch(chargerPopupVisible, (newValue) => {
      if (!newValue) {
        // Popup is closed, reset map offset
        mapOffset.value = 0;
      }
    });

    return {
      mapContainer,
      map: mapInstance, // Use reactive reference
      isLoading,
      isLoadingWeather,
      isLoadingPlaces,
      searchQuery,
      currentZoom,      userLocation,
      mapCenter,
      mapOffset,
      currentLocationName,weatherData,
      quickPlaces,
      nearbyPOIs,      chargers,
      chargersLoading,
      chargerSearch,
      filteredChargers,
      chargerStats,      clusteringEnabled,
      lidlFilterEnabled,      leftPanelOpen,
      leftPanelContent,
      handleShowLocationsChanged,
      toggleShowLocations,
      // Database connection status
      dbStatusIndicator,
      dbStatusTooltip,
      isCheckingDb,
      testDbConnection,
      // Methods
      getCurrentLocation,
      addUserLocationMarker,
      searchLocation,
      flyToPlace,
      flyToPOI,
      zoomIn,
      zoomOut,
      setZoom,
      toggleLeftPanel,
      toggleClustering,
      updateWeather,
      updateNearbyPlaces,
      loadChargersInBounds,      updateChargerMarkers,
      refreshChargers,
      flyToCharger,
      getChargerName,
      getChargerLocation,
      formatDistance,
      filterChargers,
      getWeatherIcon,
      formatTime,
      getLocationName,
      updateLocationInfo,
      // Custom popup state
      chargerPopupVisible,
      selectedCharger,
    };
  },
});
</script>

<style>
/* CSS global para popups do Leaflet - solução mais estável */
:global(.leaflet-popup-content-wrapper) {
  background: hsl(var(--b1)) !important;
  background-color: hsl(var(--b1)) !important;
  border-radius: 0.5rem !important;
  padding: 0 !important;
  margin: 0 !important;
  border: 1px solid hsl(var(--b3)) !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2) !important;
}

:global(.leaflet-popup-tip) {
  background: hsl(var(--b1)) !important;
  background-color: hsl(var(--b1)) !important;
  box-shadow: none !important;
}

:global(.leaflet-popup-content) {
  margin: 0 !important;
  padding: 0 !important;
  font-family: inherit !important;
  width: auto !important;
}

:global(.leaflet-popup) {
  margin-bottom: 20px !important;
}

/* Forçar cores DaisyUI dentro da popup */
:global(.leaflet-popup *) {
  box-sizing: border-box !important;
}

/* Classe específica para popups com tema DaisyUI */
:global(.daisyui-themed-popup .leaflet-popup-content-wrapper) {
  background: hsl(var(--b1)) !important;
  background-color: hsl(var(--b1)) !important;
  color: hsl(var(--bc)) !important;
  border: 1px solid hsl(var(--b3)) !important;
}

:global(.daisyui-themed-popup .leaflet-popup-tip) {
  background: hsl(var(--b1)) !important;
  background-color: hsl(var(--b1)) !important;
}

:global(.leaflet-popup .bg-base-100) {
  background: hsl(var(--b1)) !important;
  background-color: hsl(var(--b1)) !important;
}

:global(.leaflet-popup .text-base-content) {
  color: hsl(var(--bc)) !important;
}

:global(.leaflet-popup .text-base-content\/70) {
  color: hsl(var(--bc) / 0.7) !important;
}

:global(.leaflet-popup .border-base-300) {
  border-color: hsl(var(--b3)) !important;
}

:global(.leaflet-popup .link-primary) {
  color: hsl(var(--p)) !important;
}

:global(.leaflet-popup .shadow-lg) {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1) !important;
}

/* CSS usando seletores específicos identificados pelo usuário */
:global(#app > div > div.flex.flex-1.overflow-hidden > div.flex-1.relative > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-popup-pane > div > div.leaflet-popup-content-wrapper) {
  background: #1f2937 !important;
  background-color: #1f2937 !important;
  border: none !important;
  outline: none !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
  border-radius: 0.5rem !important;
  padding: 0 !important;
  margin: 0 !important;
}

:global(#app > div > div.flex.flex-1.overflow-hidden > div.flex-1.relative > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-popup-pane > div > div.leaflet-popup-content-wrapper > div) {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

:global(#app > div > div.flex.flex-1.overflow-hidden > div.flex-1.relative > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-popup-pane > div > div.leaflet-popup-content-wrapper > div > div) {
  background: #1f2937 !important;
  background-color: #1f2937 !important;
  color: #f9fafb !important;
  border: 1px solid #374151 !important;
  border-radius: 0.5rem !important;
  padding: 1rem !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
  min-width: 200px !important;
}
</style>

android {
    buildFeatures {
        buildConfig = true
    }
    defaultConfig {
        buildConfigField "String", "API_KEY", localProperties.getProperty("API_KEY") ?: "DEFAULT_KEY"
    }
}

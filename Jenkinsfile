node {
    stage('Clone repository') {
        /* Let's make sure we have the repository cloned to our workspace */
        checkout scm
    }

    def app
    stage('Build image') {
         app = docker.build("cjburchell/ridemanagerweb")
    }
}
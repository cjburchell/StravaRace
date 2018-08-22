node {
    stage('Clone repository') {
        /* Let's make sure we have the repository cloned to our workspace */
        checkout scm
    }

    stage('Build image') {
         docker.build("cjburchell/ridemanagerweb")
    }

    stage ('Docker push') {
          docker.withRegistry('https://390282485276.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:redpoint-ecr-credentials') {
            docker.image('cjburchell/ridemanagerweb').push('latest')
          }
    }

    stage('Build processor image') {
         docker.build("cjburchell/ridemanagerprocessor", "./processor/Dockerfile")
    }

    stage ('Docker push processor') {
              docker.withRegistry('https://390282485276.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:redpoint-ecr-credentials') {
                docker.image('cjburchell/ridemanagerprocessor').push('latest')
              }
        }
}
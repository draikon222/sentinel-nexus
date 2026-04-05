#include <stdio.h>
#include <stdlib.h>
#include <sys/shm.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <semaphore.h>
#include <fcntl.h>
#include <unistd.h>

#define KEY 1234
#define SEM_KEY 5678
#define NUMAR 10

int main() {
    int shmid, semid;
    void* ptr;
    sem_t* sem;

    // Creația segmentului de memorie partajată
    shmid = shmget(KEY, sizeof(int), IPC_CREAT | 0666);
    if (shmid == -1) {
        perror("shmget");
        exit(1);
    }

    // Alocarea memoriei
    ptr = shmat(shmid, NULL, 0);
    if (ptr == (void*) -1) {
        perror("shmat");
        exit(1);
    }

    // Crearea semaforului
    semid = semget(SEM_KEY, 1, IPC_CREAT | 0666);
    if (semid == -1) {
        perror("semget");
        exit(1);
    }

    // Inițializarea semaforului
    sem = sem_open(semid, O_CREAT, 0666, 1);
    if (sem == SEM_FAILED) {
        perror("sem_open");
        exit(1);
    }

    // Scrierea numărului în segmentul de memorie partajată
    *ptr = NUMAR;
    sem_post(sem); // Semnalăm procesului copil că putem să citim

    // Crearea procesului copil
    pid_t pid = fork();
    if (pid == -1) {
        perror("fork");
        exit(1);
    }

    if (pid == 0) { // Procesul copil
        // Așteptăm semnalul de la părintele
        sem_wait(sem);
        int numar = *ptr;
        printf("Procesul copil a citit: %d\n", numar);
        numar *= 2;
        *ptr = numar;
        exit(0);
    } else { // Procesul părinte
        wait(NULL); // Așteptăm terminarea procesului copil
        printf("Procesul părinte a terminat.\n");
    }

    // Eliberarea memoriei
    shmdt(ptr);
    shmctl(shmid, IPC_RMID, NULL);
    sem_close(sem);
    sem_unlink(SEM_KEY);
    return 0;
}

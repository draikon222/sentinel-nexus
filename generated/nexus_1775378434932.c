#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <semaphore.h>
#include <sys/wait.h>

int main() {
    // 1. Creăm un segment de memorie partajată (POSIX)
    int shm_fd = shm_open("/nexus_shm", O_CREAT | O_RDWR, 0666);
    if (shm_fd == -1) {
        perror("shm_open");
        return 1;
    }
    ftruncate(shm_fd, sizeof(int));

    int* ptr = mmap(NULL, sizeof(int), PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);
    if (ptr == MAP_FAILED) {
        perror("mmap");
        return 1;
    }

    // 2. Creăm semaforul (Inițializat pe 0, ca să forțăm așteptarea)
    sem_t* sem = sem_open("/nexus_sem", O_CREAT, 0666, 0);
    if (sem == SEM_FAILED) {
        perror("sem_open");
        return 1;
    }

    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        return 1;
    }

    if (pid == 0) { // COPILUL
        printf("[Copil] Aștept părintele să scrie...\n");
        sem_wait(sem); // Stă aici până primește semnal
        
        printf("[Copil] Am citit: %d. Îl dublez.\n", *ptr);
        *ptr *= 2;
        
        munmap(ptr, sizeof(int));
        sem_close(sem);
        exit(0);
    } else { // PĂRINTELE
        printf("[Părinte] Scriem valoarea 10...\n");
        *ptr = 10;
        
        sleep(1); // Doar ca să vezi logica în consolă
        sem_post(sem); // Deblocăm copilul

        wait(NULL); // Așteptăm să termine copilul
        printf("[Părinte] Valoarea finală în memorie: %d\n", *ptr);

        // Curățenie generală
        munmap(ptr, sizeof(int));
        shm_unlink("/nexus_shm");
        sem_close(sem);
        sem_unlink("/nexus_sem");
    }

    return 0;
}

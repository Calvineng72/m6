# M5: Distributed Execution Engine
> Full name: Calvin Eng
> Email: calvin_eng
> Username: ceng4

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises ~6 new software components, totaling ~352 added lines of code over the previous implementation. Key challenges included understanding how to shuffle, creating an append function, and figuring out how to provide the nodes the service. In order to shuffle, I realized that I need to create a new service in the MapReduce service sent to nodes. Creating the append function was difficult because of the issue with capitalization and keys, but I realized I could use the ID of the word (key) instead. I was not sure how to provide nodes with a service, but after office hours, I realized you could use all.route.put and access specific methods of the service with all.comm.send. 

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote 5 tests, which test the all.mr.exec on the three different workflows I implemented: crawler, inverted index, and distributed string matching. 

*Performance*: It takes 0m2.475s to run the 2 mr.test.js tests, and it takes 0m2.585s to run the 5 tests I wrote, which each use four nodes (1 coordinator + 3 workers).

## Key Feature
> Which extra features did you implement and how?

As part of the non-capstone student requirements I implemented the distributed persistence feature, and for the worflows, I implemented the crawler, inverted index, and distributed string matching. In order to implement distributed persistence, I stored the results of reduce to nodes (not sure if I did this properly). The crawler, inverted index, and distributed string matching required new map and reduce function, and the crawler specifically, required changes to the map service sent to nodes to resolve a Promise.

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: 12


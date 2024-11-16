# GitGroove

#### GitGroove is a project that tries to combine software development and music in an experimental, playful way it transforms all your contributions into a sonic narrative and offers a unique way to experience your work in a whole new way.

## The essence:

In GitGroove, **every** contribution becomes a musical element. The data in your GitHub profile _(e.g. day of the week, amount of contributions per day and week)_ is translated into musical parameters. This creates a **carpet of sound** that reflects the development of your projects and makes them audible.

## Harmony of data:

The harmony in GitGroove is created by the intelligent assignment of Git metrics to musical components.
The number of contributions per day, for example, influences the dynamics of Chord progressions and arpeggios been played, while the time sequence of the contributions determines the rhythm. The use of keys, scales and chords based on the contribution data creates an overall harmonic picture that is both structured and acoustically appealing.

## A space for experimentation:

GitGroove's approach is primarily experimental. It's a project that invites **you** to discover and participate. It offers developers in particular the opportunity to look at their projects from a new perspective and to experience and explore the connection between code and sound.

Feel free to expand and customize GitGroove to your liking.

#### Have Fun!

Cheers

**Mike**

---

_In case you're interested in how the harmony is created, check out the following part:_

# Harmony System

## Overview

The GitGroove Harmony System transforms Git contributions into dynamic musical patterns. The HarmonyManager forms the heart of the musical logic and works closely with the PatternGenerator.

## Basic Principles

### Keys & Scales

- Base keys: C major and C minor
- Contribution Level > 2: Major key (brighter, active sound)
- Contribution Level ≤ 2: Minor key (calmer sound)
- Intelligent root note selection with history system
- Maximum root repetitions: 4

### Chord Progressions

Dynamic progression selection based on harmonic context:

- Basic (I-IV-V-I): On dominant (5th degree)
- Pop (I-V-vi-IV): On subdominant (4th degree)
- Automatic adaptation of progression to new root notes

### Voice Distribution

1. Bass Voice (Octave 2)

   - Root note of current chord
   - Level-based rhythm patterns
   - Velocity variation for natural sound

2. Chord Voices / Pads (Octave 3)

   - Full chords with extended types
   - Rhythmic patterns by level
   - Supports maj7, min7, dom7, sus4

3. Arpeggios / Lead (Octave 3)
   - Complex pattern variations
   - Dynamic extensions
   - Active only at level > 2

## Pattern System

### Rhythm Patterns

- Level 0: Single notes
- Level 1: Basic patterns
- Level 2: Extended patterns with velocity
- Level 3: Complex rhythms
- Level 4: Full rhythmic variation

### Arpeggio Patterns

- Level 2: Basic sequence
- Level 3: Extended sequence with direction change
- Level 4: Complex melodic patterns

## Harmonic Functions

### Chord Types

- Major: [0, 4, 7]
- Minor: [0, 3, 7]
- Dominant 7: [0, 4, 7, 10]
- Minor 7: [0, 3, 7, 10]
- Sus4: [0, 5, 7]

### Root Movement

- Intelligent selection of available roots
- Focus on primary degrees (I, IV, V)
- History-based decision making
- Avoidance of frequent repetitions

### Extended Harmony

- Dynamic octave distribution
- Level-based extensions
- Automatic fallback mechanisms
- Safe note generation

## Technical Implementation

- Reactive values for key, scale, progression
- Flexible pattern generation
- Robust error handling
- Precise timing system

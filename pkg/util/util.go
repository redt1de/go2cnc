package util

import (
	"bufio"
	"math/rand"
	"os"
	"time"
)

func ReadLines(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return lines, scanner.Err()
}

func WriteLines(path string, lines []string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := bufio.NewWriter(file)
	for _, line := range lines {
		_, err = writer.WriteString(line + "\n")
		if err != nil {
			return err
		}

	}
	return writer.Flush()
}

// GenerateRandomPosition returns a float64 between -200.000 and 200.000 with 3 decimal places
func GenerateRandomPosition() float64 {
	rand.Seed(time.Now().UnixNano())
	min := -200.0
	max := 200.0

	// Generate a raw float in the range
	val := min + rand.Float64()*(max-min)

	// Round to 3 decimal places
	return float64(int(val*1000)) / 1000
}

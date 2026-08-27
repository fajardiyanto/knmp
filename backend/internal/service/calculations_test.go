package service_test

import (
	"testing"
)

func TestDeviationCalculation(t *testing.T) {
	tests := []struct {
		name      string
		rencana   float64
		realisasi float64
		expected  float64
	}{
		{"On Track", 40.0, 40.0, 0.0},
		{"Ahead of Schedule", 40.0, 45.5, 5.5},
		{"Behind Schedule", 40.5, 39.0, -1.5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dev := tt.realisasi - tt.rencana
			if dev != tt.expected {
				t.Errorf("expected %f, got %f", tt.expected, dev)
			}
		})
	}
}

func TestMilestoneProgress(t *testing.T) {
	calcMilestone := func(docCount int) int {
		if docCount >= 3 {
			return 90
		} else if docCount == 2 {
			return 75
		} else if docCount == 1 {
			return 50
		}
		return 0
	}

	if calcMilestone(0) != 0 {
		t.Errorf("expected 0, got %d", calcMilestone(0))
	}
	if calcMilestone(1) != 50 {
		t.Errorf("expected 50, got %d", calcMilestone(1))
	}
	if calcMilestone(2) != 75 {
		t.Errorf("expected 75, got %d", calcMilestone(2))
	}
	if calcMilestone(3) != 90 {
		t.Errorf("expected 90, got %d", calcMilestone(3))
	}
}

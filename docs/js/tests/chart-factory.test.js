/**
 * Chart Factory Tests
 * 
 * This file contains tests for the chart factory module.
 * To run: open test.html with chart-factory.test.js included
 */

// Mock Chart.js
window.Chart = function(canvas, options) {
    return {
        canvas: canvas,
        data: options.data,
        options: options.options,
        type: options.type,
        update: function() { console.log('Chart update called'); return true; },
        destroy: function() { console.log('Chart destroy called'); return true; },
        resize: function() { console.log('Chart resize called'); return true; }
    };
};

// Mock moment
window.moment = function(timestamp) {
    return {
        format: function(pattern) {
            return 'formatted-time';
        }
    };
};

// Mock DOM elements
function setupDOM() {
    // Create container
    const container = document.createElement('div');
    container.id = 'chartContainer';
    document.body.appendChild(container);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'test-chart';
    container.appendChild(canvas);
}

// Simple test runner
function runTests() {
    // Set up DOM for tests
    setupDOM();
    
    console.group('Chart Factory Tests');
    
    // Test initialization
    console.log('Test: Initialize chart factory');
    window.ChartFactory.initialize();
    console.log('✓ ChartFactory initialized');
    
    // Test factory registration
    console.log('Test: Custom factory registration');
    window.ChartFactory.register('custom', {
        create: function(config, data) {
            console.log('Custom factory create called');
            return new Chart(document.getElementById(config.id), {
                type: 'bar',
                data: { labels: ['Custom'], datasets: [] },
                options: {}
            });
        }
    });
    console.log('✓ Custom factory registered');
    
    // Test chart creation
    console.log('Test: Create chart');
    const chartConfig = {
        id: 'test-chart',
        title: 'Test Chart',
        color: '#ff0000',
        field: 1
    };
    
    const chartData = {
        feeds: [
            { created_at: '2023-01-01', field1: 10 },
            { created_at: '2023-01-02', field1: 20 }
        ]
    };
    
    const chart = window.ChartFactory.create(chartConfig, chartData);
    console.log('✓ Chart created:', chart !== null);
    
    // Test chart instance retrieval
    console.log('Test: Get chart instance');
    const instance = window.ChartFactory.getInstance('test-chart');
    console.log('✓ Chart instance retrieved:', instance !== null);
    
    // Test chart update
    console.log('Test: Update chart');
    const updated = window.ChartFactory.update('test-chart', {
        feeds: [
            { created_at: '2023-01-01', field1: 15 },
            { created_at: '2023-01-02', field1: 25 }
        ]
    });
    console.log('✓ Chart updated:', updated);
    
    // Test chart destruction
    console.log('Test: Destroy chart');
    const destroyed = window.ChartFactory.destroy('test-chart');
    console.log('✓ Chart destroyed:', destroyed);
    
    // Test resize all method
    console.log('Test: Resize all charts');
    window.ChartFactory.create(chartConfig, chartData);
    window.ChartFactory.resizeAll();
    console.log('✓ Resize all called');
    
    // Test multi-series chart creation
    console.log('Test: Create multi-series chart');
    const multiSeriesConfig = {
        id: 'test-chart',
        title: 'Multi-Series Test',
        series: [
            { title: 'Series 1', field: 1, color: '#ff0000' },
            { title: 'Series 2', field: 2, color: '#00ff00' }
        ]
    };
    
    const multiSeriesData = {
        is_multi_series: true,
        series: [
            {
                title: 'Series 1',
                feeds: [
                    { created_at: '2023-01-01', field1: 10 },
                    { created_at: '2023-01-02', field1: 20 }
                ],
                field: 1
            },
            {
                title: 'Series 2',
                feeds: [
                    { created_at: '2023-01-01', field2: 15 },
                    { created_at: '2023-01-02', field2: 25 }
                ],
                field: 2
            }
        ]
    };
    
    // Clean up first
    window.ChartFactory.destroy('test-chart');
    
    const multiSeriesChart = window.ChartFactory.create(multiSeriesConfig, multiSeriesData);
    console.log('✓ Multi-series chart created:', multiSeriesChart !== null);
    
    // Clean up after tests
    window.ChartFactory.destroy('test-chart');
    document.body.removeChild(document.getElementById('chartContainer'));
    
    console.groupEnd();
    
    return 'Tests completed';
}

// Run tests on load
window.addEventListener('DOMContentLoaded', function() {
    // Add test button to the page
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Chart Factory Tests';
    testButton.onclick = runTests;
    document.body.appendChild(testButton);
});
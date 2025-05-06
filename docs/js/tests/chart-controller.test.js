/**
 * Chart Controller Tests
 * 
 * This file contains tests for the chart controller module.
 * To run: open test.html with chart-controller.test.js included
 */

// Simple test runner
function runControllerTests() {
    console.group('Chart Controller Tests');
    
    // Test initialization
    console.log('Test: Initialize chart controller');
    window.ChartController.initialize();
    console.log('✓ ChartController initialized');
    
    // Test global state
    console.log('Test: Get global state');
    const globalState = window.ChartController.getGlobalState();
    console.log('✓ Global state retrieved:', globalState.initialized === true);
    
    // Test updating global state
    console.log('Test: Update global state');
    window.ChartController.updateGlobalState({ testValue: 123 });
    const updatedState = window.ChartController.getGlobalState();
    console.log('✓ Global state updated:', updatedState.testValue === 123);
    
    // Test chart registration
    console.log('Test: Register chart');
    window.ChartController.registerChart('test-chart', {
        title: 'Test Chart',
        category: 'test'
    });
    const chartState = window.ChartController.getChartState('test-chart');
    console.log('✓ Chart registered:', chartState !== null);
    
    // Test chart state update
    console.log('Test: Update chart state');
    window.ChartController.updateChartState('test-chart', { loading: true });
    const updatedChartState = window.ChartController.getChartState('test-chart');
    console.log('✓ Chart state updated:', updatedChartState.loading === true);
    
    // Test event listeners
    console.log('Test: Event listeners');
    let eventFired = false;
    const listener = window.ChartController.addEventListener('stateChange', (event) => {
        eventFired = true;
    });
    
    window.ChartController.updateGlobalState({ testEvent: true });
    console.log('✓ Event fired:', eventFired);
    
    // Clean up listener
    listener.remove();
    
    // Test setting visibility by category
    console.log('Test: Set visibility by category');
    window.ChartController.registerChart('test-chart-2', {
        title: 'Test Chart 2',
        category: 'test'
    });
    
    const categoryCharts = window.ChartController.setVisibilityByCategory('test');
    console.log('✓ Category charts found:', categoryCharts.length === 2);
    
    // Test theme change
    console.log('Test: Theme change');
    window.ChartController.updateTheme(true);
    const darkMode = window.ChartController.getGlobalState().darkMode;
    console.log('✓ Theme updated:', darkMode === true);
    
    // Test display mode change
    console.log('Test: Display mode change');
    const originalMode = window.ChartController.getGlobalState().displayMode;
    window.ChartController.updateDisplayMode();
    const newMode = window.ChartController.getGlobalState().displayMode;
    console.log('✓ Display mode updated properly:', newMode === originalMode);
    
    // Test chart interaction
    console.log('Test: Chart interaction');
    window.ChartController.handleChartInteraction('test-chart', 'hover', { x: 100, y: 100 });
    const interactedState = window.ChartController.getChartState('test-chart');
    console.log('✓ Chart interaction handled:', interactedState.hovered === true);
    
    // Test stats visibility toggle
    console.log('Test: Stats visibility toggle');
    const currentVisibility = window.ChartController.getGlobalState().showStats;
    const newVisibility = window.ChartController.toggleStatsVisibility();
    console.log('✓ Stats visibility toggled:', newVisibility !== currentVisibility);
    
    // Restore original visibility
    window.ChartController.toggleStatsVisibility(currentVisibility);
    
    // Test range change
    console.log('Test: Range change');
    window.ChartController.changeRange(7, 5000);
    const rangeState = window.ChartController.getGlobalState();
    console.log('✓ Range changed:', rangeState.currentRange === 7 && rangeState.currentResults === 5000);
    
    // Test chart sync
    console.log('Test: Chart sync');
    window.ChartController.syncCharts('test-chart', 5, ['test-chart-2']);
    const syncState = window.ChartController.getGlobalState().lastSync;
    console.log('✓ Charts synced:', syncState && syncState.sourceChartId === 'test-chart');
    
    // Test unregistering chart
    console.log('Test: Unregister chart');
    window.ChartController.unregisterChart('test-chart');
    window.ChartController.unregisterChart('test-chart-2');
    const afterUnregister = window.ChartController.getChartState('test-chart');
    console.log('✓ Chart unregistered:', afterUnregister === null);
    
    console.groupEnd();
    
    return 'Controller tests completed';
}

// Run tests on load
window.addEventListener('DOMContentLoaded', function() {
    // Add test button to the page
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Chart Controller Tests';
    testButton.onclick = runControllerTests;
    testButton.style.marginLeft = '10px';
    document.body.appendChild(testButton);
});